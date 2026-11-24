import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError, sha, verifySecret } from "@/lib/als/auth";
import type { OrderDTO, OrderItemDTO } from "@/lib/als/types";
import type { PriceTier } from "@/lib/als/types";

export const dynamic = "force-dynamic";

type IncomingItem = {
  kind: "FINGERLING" | "MARKET" | "TRAINING";
  refId: string;
  qty: number;
  sessionId?: string;
  date?: string | null;
};

type IncomingOrder = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  fulfilment: "PICKUP" | "DELIVERY";
  areaName?: string;
  deliveryDate?: string;
  items: IncomingItem[];
  notes?: string;
};

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ALS-${year}-`;
  const count = await db.order.count({ where: { orderNumber: { startsWith: prefix } } });
  let seq = count + 1;
  // ensure uniqueness even after deletions
  for (;;) {
    const num = `${prefix}${String(seq).padStart(4, "0")}`;
    const exists = await db.order.findUnique({ where: { orderNumber: num } });
    if (!exists) return num;
    seq += 1;
  }
}

// POST /api/orders — create an order (the "Send order on WhatsApp" moment)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingOrder;
    if (!body?.name?.trim()) throw new HttpError(400, "Please enter your name.");
    if (!body?.phone?.trim() || body.phone.trim().length < 9)
      throw new HttpError(400, "Please enter a valid phone number.");
    if (!Array.isArray(body.items) || body.items.length === 0)
      throw new HttpError(400, "Your cart is empty.");
    if (body.fulfilment === "DELIVERY" && !body.areaName)
      throw new HttpError(400, "Please choose a delivery area.");
    if (!body.deliveryDate) throw new HttpError(400, "Please choose a collection or delivery date.");

    // delivery date must be an open ALS date
    const openDate = await db.collectionDate.findUnique({ where: { date: body.deliveryDate } });
    if (!openDate || !openDate.isOpen || openDate.date < new Date().toISOString().slice(0, 10))
      throw new HttpError(400, "That collection date is not open. Please pick another date.");

    // delivery fee from server data
    let areaFee = 0;
    let areaName: string | null = null;
    if (body.fulfilment === "DELIVERY") {
      const area = await db.deliveryArea.findUnique({ where: { name: body.areaName! } });
      if (!area) throw new HttpError(400, "Unknown delivery area.");
      areaFee = area.fee;
      areaName = area.name;
    }

    // build server-priced lines (never trust client prices)
    const lines: OrderItemDTO[] = [];
    const stockOps: { productId: string; qty: number }[] = [];
    const sessionOps: { sessionId: string; qty: number }[] = [];

    for (const raw of body.items) {
      const qty = Math.floor(Number(raw.qty));
      if (!qty || qty <= 0) throw new HttpError(400, "Invalid quantity in cart.");

      if (raw.kind === "FINGERLING" || raw.kind === "MARKET") {
        const p = await db.product.findUnique({ where: { id: raw.refId } });
        if (!p || !p.active) throw new HttpError(400, "One of the items is no longer available.");
        if (p.stock < qty)
          throw new HttpError(400, `Only ${p.stock.toLocaleString()} ${p.unit}(s) of “${p.name}” are in stock right now.`);
        const tiers = p.priceTiers ? (JSON.parse(p.priceTiers) as PriceTier[]) : null;
        let unitPrice = p.price;
        if (tiers) {
          for (const t of [...tiers].sort((a, b) => a.minQty - b.minQty)) if (qty >= t.minQty) unitPrice = t.price;
        }
        lines.push({
          kind: raw.kind,
          refId: p.id,
          name: p.name,
          variant: raw.kind === "FINGERLING" ? (tiers ? `${qty.toLocaleString()} pcs @ GHS ${unitPrice.toFixed(2)}` : "") : "—",
          qty,
          unit: p.unit,
          unitPrice,
          lineTotal: Math.round(qty * unitPrice * 100) / 100,
        });
        stockOps.push({ productId: p.id, qty });
      } else if (raw.kind === "TRAINING") {
        if (!raw.sessionId) throw new HttpError(400, "Training session missing.");
        const s = await db.trainingSession.findUnique({ where: { id: raw.sessionId }, include: { course: true } });
        if (!s || !s.course.active) throw new HttpError(400, "That training session is no longer available.");
        if (s.seats - s.booked < qty) throw new HttpError(400, `Only ${Math.max(0, s.seats - s.booked)} seat(s) left in “${s.course.title}” on that date.`);
        lines.push({
          kind: "TRAINING",
          refId: s.courseId,
          name: s.course.title,
          variant: `${s.date} · ${s.timeText} · ${s.location}`,
          qty,
          unit: "seat",
          unitPrice: s.course.fee,
          lineTotal: Math.round(qty * s.course.fee * 100) / 100,
          date: s.date,
        });
        sessionOps.push({ sessionId: s.id, qty });
      } else {
        throw new HttpError(400, "Unknown item type.");
      }
    }

    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const total = Math.round((subtotal + areaFee) * 100) / 100;
    const orderNumber = await nextOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: body.name.trim(),
        customerPhone: body.phone.trim(),
        customerEmail: body.email?.trim() || null,
        customerCity: body.city?.trim() || null,
        fulfilment: body.fulfilment,
        areaName,
        areaFee,
        deliveryDate: body.deliveryDate,
        items: JSON.stringify(lines),
        subtotal,
        total,
        status: "RECEIVED",
        notes: body.notes?.trim() || null,
        events: {
          create: [{ status: "RECEIVED", note: "Order sent on WhatsApp and saved.", actor: null }],
        },
      },
    });

    // decrement stock / book seats (best-effort integrity)
    for (const op of stockOps) {
      await db.product.update({ where: { id: op.productId }, data: { stock: { decrement: op.qty } } });
    }
    for (const op of sessionOps) {
      await db.trainingSession.update({ where: { id: op.sessionId }, data: { booked: { increment: op.qty } } });
      const s = await db.trainingSession.findUnique({ where: { id: op.sessionId } });
      if (s) {
        await db.booking.create({
          data: {
            reference: `${orderNumber}-S${s.id.slice(-4).toUpperCase()}`,
            sessionId: s.id,
            customerName: body.name.trim(),
            phone: body.phone.trim(),
            email: body.email?.trim() || null,
            seats: op.qty,
            total: lines.find((l) => l.variant.includes(s.date) && l.kind === "TRAINING")?.lineTotal ?? 0,
            status: "PENDING_PAYMENT",
          },
        });
      }
    }
    await db.collectionDate.update({ where: { date: body.deliveryDate }, data: { booked: { increment: 1 } } });

    // order received emails (customer + ALS)
    if (body.email) {
      await db.emailLog.create({
        data: {
          toEmail: body.email.trim(),
          subject: `Order ${orderNumber} received — Aquatic Link Solutions`,
          body: `Dear ${body.name.trim()},\n\nWe have your order ${orderNumber} for GHS ${total.toFixed(2)}.\n\nNext step: pay by MoMo or bank transfer and upload your payment proof on your order page. ALS will confirm your payment and issue your branded receipt.\n\nTrack your order any time with order number ${orderNumber} and your phone number.\n\n— Aquatic Link Solutions, Akuse`,
          kind: "ORDER_STAGE",
        },
      });
    }
    await db.emailLog.create({
      data: {
        toEmail: "orders@aquaticlinkgh.com",
        subject: `New order ${orderNumber} — ${body.name.trim()} (GHS ${total.toFixed(2)})`,
        body: `New order ${orderNumber} created on the platform and sent on WhatsApp.\nCustomer: ${body.name.trim()} — ${body.phone.trim()}\nFulfilment: ${body.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery to ${areaName}`} on ${body.deliveryDate}\nTotal: GHS ${total.toFixed(2)}`,
        kind: "ORDER_STAGE",
      },
    });

    return NextResponse.json({ orderNumber, total, order: serializeOrder(order) });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

function serializeOrder(o: {
  id: string; orderNumber: string; customerName: string; customerPhone: string; customerEmail: string | null;
  customerCity: string | null; fulfilment: string; areaName: string | null; areaFee: number; deliveryDate: string | null;
  items: string; subtotal: number; total: number; status: string; paymentMethod: string | null; paymentRef: string | null;
  receiptCode: string | null; receiptIssuedAt: Date | null; whatsappSent: boolean; notes: string | null;
  createdAt: Date; updatedAt: Date;
}): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    customerCity: o.customerCity,
    fulfilment: o.fulfilment as "PICKUP" | "DELIVERY",
    areaName: o.areaName,
    areaFee: o.areaFee,
    deliveryDate: o.deliveryDate,
    items: JSON.parse(o.items) as OrderItemDTO[],
    subtotal: o.subtotal,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentRef: o.paymentRef,
    receiptCode: o.receiptCode,
    receiptIssuedAt: o.receiptIssuedAt ? o.receiptIssuedAt.toISOString() : null,
    whatsappSent: o.whatsappSent,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    events: [],
    proofs: [],
  };
}

// GET /api/orders?number=ALS-2026-0001&phone=024... — track an order
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const number = searchParams.get("number")?.trim();
    const phone = searchParams.get("phone")?.trim();
    if (!number || !phone) throw new HttpError(400, "Enter your order number and phone number.");

    const order = await db.order.findUnique({
      where: { orderNumber: number.toUpperCase() },
      include: { events: { orderBy: { createdAt: "asc" } }, proofs: { orderBy: { uploadedAt: "desc" } } },
    });
    if (!order) throw new HttpError(404, "No order found with that number.");
    const digits = (s: string) => s.replace(/[^0-9]/g, "");
    const given = digits(phone);
    if (given.length < 4) throw new HttpError(400, "Enter your phone number (at least the last 4 digits).");
    if (!digits(order.customerPhone).endsWith(given.slice(-7)))
      throw new HttpError(403, "Phone number does not match this order.");

    return NextResponse.json({
      order: {
        ...serializeOrder(order),
        events: order.events.map((e) => ({
          id: e.id, status: e.status, note: e.note, actor: e.actor, createdAt: e.createdAt.toISOString(),
        })),
        proofs: order.proofs.map((p) => ({ id: p.id, name: p.name, uploadedAt: p.uploadedAt.toISOString() })),
      },
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/orders — upload payment proof / mark WhatsApp sent
export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      orderNumber: string;
      phone: string;
      action: "upload_proof" | "mark_whatsapp_sent";
      paymentMethod?: string;
      paymentRef?: string;
      proof?: { name: string; dataUrl: string };
    };
    const order = await db.order.findUnique({ where: { orderNumber: body.orderNumber?.toUpperCase() } });
    if (!order) throw new HttpError(404, "No order found with that number.");
    const digits = (s: string) => s.replace(/[^0-9]/g, "");
    if (!digits(order.customerPhone).endsWith(digits(body.phone ?? "").slice(-7)))
      throw new HttpError(403, "Phone number does not match this order.");

    if (body.action === "upload_proof") {
      if (!order.paymentMethod && !body.paymentMethod) throw new HttpError(400, "Choose a payment method (MoMo or bank).");
      if (body.proof) {
        if (!body.proof.dataUrl.startsWith("data:image/") && !body.proof.dataUrl.startsWith("data:application/pdf"))
          throw new HttpError(400, "Upload an image (JPG/PNG) of your payment proof.");
        if (body.proof.dataUrl.length > 2_400_000) throw new HttpError(400, "Image too large — please upload a smaller photo (max ~1.5 MB).");
        await db.proofFile.create({
          data: { orderNumber: order.orderNumber, name: body.proof.name || "payment-proof", dataUrl: body.proof.dataUrl },
        });
      }
      await db.order.update({
        where: { orderNumber: order.orderNumber },
        data: {
          paymentMethod: body.paymentMethod ?? order.paymentMethod,
          paymentRef: body.paymentRef?.trim() || order.paymentRef,
        },
      });
      await db.emailLog.create({
        data: {
          toEmail: "orders@aquaticlinkgh.com",
          subject: `Payment proof uploaded for ${order.orderNumber}`,
          body: `${order.customerName} uploaded payment proof for order ${order.orderNumber}. Confirm it in the ALS dashboard to issue the receipt.`,
          kind: "ORDER_STAGE",
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "mark_whatsapp_sent") {
      await db.order.update({ where: { orderNumber: order.orderNumber }, data: { whatsappSent: true } });
      return NextResponse.json({ ok: true });
    }

    throw new HttpError(400, "Unknown action.");
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// keep sha/verifySecret imported for potential future use
void sha; void verifySecret;
