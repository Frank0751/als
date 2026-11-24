import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerToken, errorResponse, hashSecret, HttpError, verifySecret } from "@/lib/als/auth";
import type { OrderDTO, OrderItemDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

function digits(s: string) { return s.replace(/[^0-9]/g, ""); }

// POST /api/auth/customer — register or login with phone + 4-digit PIN
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode: "register" | "login"; name?: string; phone: string; pin: string; email?: string; city?: string; address?: string;
    };
    const phone = digits(body.phone ?? "");
    if (phone.length < 9) throw new HttpError(400, "Please enter a valid phone number.");
    if (!body.pin || !/^[0-9]{4}$/.test(body.pin)) throw new HttpError(400, "Your PIN must be 4 digits.");
    if (!/^[0-9]/.test(phone)) throw new HttpError(400, "Please enter a valid Ghana phone number.");

    const existing = await db.customer.findUnique({ where: { phone } });

    if (body.mode === "register") {
      if (!body.name?.trim()) throw new HttpError(400, "Please enter your name.");
      if (existing) throw new HttpError(409, "An account with this phone number already exists — please sign in.");
      const c = await db.customer.create({
        data: {
          phone,
          name: body.name.trim(),
          email: body.email?.trim() || null,
          city: body.city?.trim() || null,
          address: body.address?.trim() || null,
          pinHash: hashSecret(body.pin),
        },
      });
      return NextResponse.json({
        customer: { id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, address: c.address },
        token: customerToken(c.pinHash, c.phone),
      });
    }

    // login
    if (!existing) throw new HttpError(404, "No account with this phone number yet — tap “New here? Create an account”.");
    if (!verifySecret(body.pin, existing.pinHash)) throw new HttpError(401, "Wrong PIN. Please try again.");
    return NextResponse.json({
      customer: { id: existing.id, name: existing.name, phone: existing.phone, email: existing.email, city: existing.city, address: existing.address },
      token: customerToken(existing.pinHash, existing.phone),
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// GET /api/auth/customer?token=... — profile + order history (x-customer-token header)
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("x-customer-token");
    const { searchParams } = new URL(req.url);
    const phone = digits(searchParams.get("phone") ?? "");
    if (!token || !phone) throw new HttpError(401, "Please sign in.");
    const c = await db.customer.findUnique({ where: { phone } });
    if (!c || customerToken(c.pinHash, c.phone) !== token) throw new HttpError(401, "Please sign in again.");
    // phones may be stored with spaces/dashes — match on digits
    const candidates = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { events: { orderBy: { createdAt: "asc" } }, proofs: { orderBy: { uploadedAt: "desc" } } },
      take: 500,
    });
    const phoneTail = phone.slice(-9);
    const orders = candidates.filter((o) => digits(o.customerPhone).endsWith(phoneTail));
    const dto: OrderDTO[] = orders.map((o) => ({
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
      events: o.events.map((e) => ({ id: e.id, status: e.status, note: e.note, actor: e.actor, createdAt: e.createdAt.toISOString() })),
      proofs: o.proofs.map((p) => ({ id: p.id, name: p.name, uploadedAt: p.uploadedAt.toISOString() })),
    }));
    return NextResponse.json({
      customer: { id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, address: c.address },
      orders: dto,
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
