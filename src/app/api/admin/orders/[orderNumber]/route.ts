import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, HttpError, receiptCode, requireStaff } from "@/lib/als/auth";
import { statusLabel } from "@/lib/als/format";
import type { OrderItemDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// PATCH /api/admin/orders/[orderNumber] — status updates, payment confirmation, cancellation
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const { orderNumber } = await ctx.params;
    const body = (await req.json()) as {
      action: "set_status" | "confirm_payment" | "cancel";
      status?: string;
      paymentMethod?: string;
      paymentRef?: string;
    };
    const order = await db.order.findUnique({ where: { orderNumber: orderNumber.toUpperCase() } });
    if (!order) throw new HttpError(404, "Order not found.");

    if (body.action === "confirm_payment") {
      const method = body.paymentMethod ?? order.paymentMethod;
      if (!method) throw new HttpError(400, "Choose the payment method (MoMo, bank or USD).");
      const code = order.receiptCode ?? receiptCode();
      await db.order.update({
        where: { orderNumber: order.orderNumber },
        data: {
          paymentMethod: method,
          paymentRef: body.paymentRef?.trim() || order.paymentRef,
          status: order.status === "RECEIVED" ? "PAYMENT_CONFIRMED" : order.status,
          receiptCode: code,
          receiptIssuedAt: order.receiptIssuedAt ?? new Date(),
        },
      });
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          status: "PAYMENT_CONFIRMED",
          note: `Payment confirmed (${method})${order.paymentRef ? ` · ref ${order.paymentRef}` : ""}. Receipt issued.`,
          actor: staff.name,
        },
      });
      if (order.customerEmail) {
        await db.emailLog.create({
          data: {
            toEmail: order.customerEmail,
            subject: `Payment confirmed — receipt for ${order.orderNumber} — Aquatic Link Solutions`,
            body: `Dear ${order.customerName},\n\nYour payment for order ${order.orderNumber} (GHS ${order.total.toFixed(2)}, ${method}) has been confirmed by ALS.\n\nYour branded receipt is ready on your order page. Receipt verification code: ${code}\nAnyone can check this code on the “Verify receipt” page of our website.\n\n${order.fulfilment === "PICKUP" ? `Collection date: ${order.deliveryDate ?? "—"} at the ALS farm gate, Akuse.` : `Delivery date: ${order.deliveryDate ?? "—"} to ${order.areaName ?? "your area"}.`}\n\nThank you for farming with ALS.\nAquatic Link Solutions — Akuse, Eastern Region`,
            kind: "RECEIPT",
          },
        });
      }
      // training lines: confirm bookings; online courses get their joining links
      const linked = await db.booking.findMany({ where: { reference: { startsWith: order.orderNumber } } });
      for (const b of linked) {
        await db.booking.update({ where: { id: b.id }, data: { status: "CONFIRMED" } });
        const s = await db.trainingSession.findUnique({ where: { id: b.sessionId }, include: { course: true } });
        if (s && s.course.type === "ONLINE" && b.email) {
          await db.emailLog.create({
            data: {
              toEmail: b.email,
              subject: `Your joining link — ${s.course.title} — Aquatic Link Solutions`,
              body: `Dear ${b.customerName},\n\nYour payment is confirmed and your seat for “${s.course.title}” (${s.date}, ${s.timeText}) is booked.\n\nJoining link: https://meet.aquaticlinkgh.com/${s.id.slice(-8)}\nCourse materials are attached to this email. See you online!\n\n— ALS Training Team`,
              kind: "ONLINE_COURSE",
            },
          });
        }
      }
      await audit(staff.name, "PAYMENT_CONFIRMED", `${order.orderNumber} — ${method}`);
      return NextResponse.json({ ok: true, receiptCode: code });
    }

    if (body.action === "set_status") {
      const status = body.status ?? "";
      const allowed = ["PREPARING", "READY_OUT", "OUT_FOR_DELIVERY", "COMPLETED"];
      if (!allowed.includes(status)) throw new HttpError(400, "Invalid status.");
      await db.order.update({ where: { orderNumber: order.orderNumber }, data: { status } });
      const stageNote: Record<string, string> = {
        PREPARING: "Your order is being prepared.",
        READY_OUT: "Ready for pickup at the ALS farm gate, Akuse.",
        OUT_FOR_DELIVERY: "Your order is out for delivery.",
        COMPLETED: "Your order is complete. Thank you for farming with ALS!",
      };
      await db.orderEvent.create({
        data: { orderId: order.id, status, note: stageNote[status], actor: staff.name },
      });
      if (order.customerEmail) {
        await db.emailLog.create({
          data: {
            toEmail: order.customerEmail,
            subject: `Order ${order.orderNumber}: ${statusLabel(status)} — Aquatic Link Solutions`,
            body: `Dear ${order.customerName},\n\n${stageNote[status]}\n\nTrack your order any time with order number ${order.orderNumber} and your phone number.\n\n— Aquatic Link Solutions, Akuse`,
            kind: "ORDER_STAGE",
          },
        });
      }
      await audit(staff.name, "STATUS_UPDATE", `${order.orderNumber} → ${status}`);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "cancel") {
      await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
      if (order.status === "COMPLETED") throw new HttpError(400, "A completed order cannot be cancelled.");
      // restore stock
      const items = JSON.parse(order.items) as OrderItemDTO[];
      for (const l of items) {
        if (l.kind === "FINGERLING" || l.kind === "MARKET") {
          await db.product.update({ where: { id: l.refId }, data: { stock: { increment: l.qty } } }).catch(() => {});
        }
        if (l.kind === "TRAINING") {
          await db.booking.updateMany({ where: { reference: { startsWith: order.orderNumber } }, data: { status: "CANCELLED" } });
        }
      }
      await db.order.update({ where: { orderNumber: order.orderNumber }, data: { status: "CANCELLED" } });
      await db.orderEvent.create({
        data: { orderId: order.id, status: "CANCELLED", note: "Order cancelled by ALS. Stock has been returned to the store.", actor: staff.name },
      });
      await audit(staff.name, "ORDER_CANCELLED", order.orderNumber);
      return NextResponse.json({ ok: true });
    }

    throw new HttpError(400, "Unknown action.");
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
