import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff } from "@/lib/als/auth";
import type { OrderItemDTO, ReportsDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/reports — sales by day, method and product
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const orders = await db.order.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: "asc" } });

    const byDayMap = new Map<string, { total: number; count: number }>();
    const byMethodMap = new Map<string, number>();
    const byProductMap = new Map<string, { total: number; qty: number }>();
    let revenue = 0;
    let fingerlingsSold = 0;
    let completed = 0;

    for (const o of orders) {
      revenue += o.total;
      if (o.status === "COMPLETED") completed += 1;
      const day = o.createdAt.toISOString().slice(0, 10);
      const d = byDayMap.get(day) ?? { total: 0, count: 0 };
      d.total = Math.round((d.total + o.total) * 100) / 100;
      d.count += 1;
      byDayMap.set(day, d);
      if (o.paymentMethod) byMethodMap.set(o.paymentMethod, (byMethodMap.get(o.paymentMethod) ?? 0) + o.total);
      const items = JSON.parse(o.items) as OrderItemDTO[];
      for (const l of items) {
        const p = byProductMap.get(l.name) ?? { total: 0, qty: 0 };
        p.total = Math.round((p.total + l.lineTotal) * 100) / 100;
        p.qty += l.qty;
        byProductMap.set(l.name, p);
        if (l.kind === "FINGERLING") fingerlingsSold += l.qty;
      }
    }

    const byDay: ReportsDTO["byDay"] = [...byDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, v]) => ({ date, total: v.total, count: v.count }));

    const dto: ReportsDTO = {
      byDay,
      byMethod: [...byMethodMap.entries()].map(([method, total]) => ({ method, total: Math.round(total * 100) / 100 })),
      byProduct: [...byProductMap.entries()]
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15),
      totals: {
        revenue: Math.round(revenue * 100) / 100,
        orders: orders.length,
        fingerlingsSold,
        completed,
      },
    };
    return NextResponse.json(dto);
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
