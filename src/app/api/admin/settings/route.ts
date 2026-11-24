import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, HttpError, requireStaff } from "@/lib/als/auth";
import type { DeliveryAreaDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/settings — content map + delivery areas
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const [content, areas] = await Promise.all([
      db.siteContent.findMany({ orderBy: { key: "asc" } }),
      db.deliveryArea.findMany({ orderBy: { fee: "asc" } }),
    ]);
    const areaDTOs: DeliveryAreaDTO[] = areas.map((a) => ({ id: a.id, name: a.name, fee: a.fee }));
    return NextResponse.json({
      content: Object.fromEntries(content.map((r) => [r.key, r.value])),
      areas: areaDTOs,
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// POST /api/admin/settings — save content keys and delivery areas
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as {
      content?: Record<string, string>;
      areas?: { name: string; fee: number }[];
    };
    if (body.content) {
      for (const [key, value] of Object.entries(body.content)) {
        if (typeof value !== "string") continue;
        await db.siteContent.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      await audit(staff.name, "SETTINGS_UPDATE", `Content keys saved: ${Object.keys(body.content).join(", ")}`);
    }
    if (Array.isArray(body.areas)) {
      for (const a of body.areas) {
        if (!a.name?.trim()) continue;
        const fee = Number(a.fee);
        if (Number.isNaN(fee) || fee < 0) continue;
        await db.deliveryArea.upsert({ where: { name: a.name.trim() }, create: { name: a.name.trim(), fee }, update: { fee } });
      }
      await audit(staff.name, "SETTINGS_UPDATE", `Delivery areas saved (${body.areas.length})`);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// DELETE /api/admin/settings?area=name — remove a delivery area
export async function DELETE(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const area = new URL(req.url).searchParams.get("area");
    if (!area) throw new HttpError(400, "Missing area.");
    await db.deliveryArea.deleteMany({ where: { name: area } });
    await audit(staff.name, "SETTINGS_UPDATE", `Delivery area removed: ${area}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
