import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, HttpError, requireStaff } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/calendar — collection dates
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const dates = await db.collectionDate.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json({ dates: dates.filter((d) => d.date >= new Date().toISOString().slice(0, 10) || d.isOpen) });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// POST /api/admin/calendar — open a new date
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as { date: string; capacity?: number; note?: string };
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.date ?? "")) throw new HttpError(400, "Pick a date.");
    const exists = await db.collectionDate.findUnique({ where: { date: body.date } });
    if (exists) throw new HttpError(409, "That date already exists in the calendar.");
    const capacity = Math.max(1, Math.floor(Number(body.capacity ?? 25)));
    await db.collectionDate.create({ data: { date: body.date, isOpen: true, capacity, note: body.note?.trim() || null } });
    await audit(staff.name, "CALENDAR_ADD", `Opened ${body.date} (capacity ${capacity})`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/admin/calendar — toggle / capacity
export async function PATCH(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as { id: string; isOpen?: boolean; capacity?: number };
    const d = await db.collectionDate.findUnique({ where: { id: body.id } });
    if (!d) throw new HttpError(404, "Date not found.");
    const data: Record<string, unknown> = {};
    if (body.isOpen !== undefined) data.isOpen = !!body.isOpen;
    if (body.capacity !== undefined) data.capacity = Math.max(1, Math.floor(Number(body.capacity)));
    await db.collectionDate.update({ where: { id: body.id }, data });
    await audit(staff.name, "CALENDAR_UPDATE", `${d.date} — ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// DELETE /api/admin/calendar?id=...
export async function DELETE(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "Missing id.");
    const d = await db.collectionDate.findUnique({ where: { id } });
    if (!d) throw new HttpError(404, "Date not found.");
    await db.collectionDate.delete({ where: { id } });
    await audit(staff.name, "CALENDAR_DELETE", `Removed ${d.date}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
