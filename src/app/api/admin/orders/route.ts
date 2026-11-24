import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff } from "@/lib/als/auth";
import type { AdminOrdersDTO, OrderDTO, OrderItemDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

type OrderRow = Awaited<ReturnType<typeof db.order.findMany>>[number];

function serialize(o: OrderRow): OrderDTO {
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
    events: o.events.map((e) => ({ id: e.id, status: e.status, note: e.note, actor: e.actor, createdAt: e.createdAt.toISOString() })),
    proofs: o.proofs.map((p) => ({ id: p.id, name: p.name, uploadedAt: p.uploadedAt.toISOString() })),
  };
}

// GET /api/admin/orders — everything on the ALS orders screen
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const [rawOrders, demandRows, quotes, inbox] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { createdAt: "asc" } }, proofs: { orderBy: { uploadedAt: "desc" } } },
        take: 400,
      }),
      db.notifyRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { product: true } }),
      db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    const dto: AdminOrdersDTO = {
      orders: rawOrders.map(serialize),
      demand: demandRows.map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        productName: d.product.name,
        createdAt: d.createdAt.toISOString(),
      })),
      quotes: quotes.map((q) => ({
        id: q.id,
        name: q.name,
        org: q.org,
        phone: q.phone,
        email: q.email,
        message: q.message,
        createdAt: q.createdAt.toISOString(),
      })),
      inbox: messagesToDTO(inbox),
    };
    return NextResponse.json(dto);
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

function messagesToDTO(
  rows: Awaited<ReturnType<typeof db.contactMessage.findMany>>
): AdminOrdersDTO["inbox"] {
  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  }));
}
