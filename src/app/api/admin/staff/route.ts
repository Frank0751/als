import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, hashSecret, HttpError, requireStaff } from "@/lib/als/auth";
import type { StaffDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/staff, staff list (OWNER)
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "OWNER");
    const rows = await db.staff.findMany({ orderBy: { username: "asc" } });
    const staff: StaffDTO[] = rows.map((s) => ({ id: s.id, username: s.username, name: s.name, role: s.role }));
    return NextResponse.json({
      staff,
      active: rows.map((s) => ({ id: s.id, active: s.active })),
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// POST /api/admin/staff, add a staff login (OWNER)
export async function POST(req: NextRequest) {
  try {
    const me = await requireStaff(req.headers.get("x-staff-token"), "OWNER");
    const body = (await req.json()) as { username: string; name: string; role: string; password: string };
    const username = body.username?.trim().toLowerCase();
    if (!username || !/^[a-z0-9_.-]{3,20}$/.test(username)) throw new HttpError(400, "Username: 3-20 letters, numbers, dots or dashes.");
    if (!body.name?.trim()) throw new HttpError(400, "Enter the staff member's name.");
    if (!["OWNER", "MANAGER", "STAFF"].includes(body.role ?? "")) throw new HttpError(400, "Pick a role.");
    if (!body.password || body.password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
    const exists = await db.staff.findUnique({ where: { username } });
    if (exists) throw new HttpError(409, "That username is taken.");
    await db.staff.create({
      data: { username, name: body.name.trim(), role: body.role, passwordHash: hashSecret(body.password) },
    });
    await audit(me.name, "STAFF_ADD", `${body.name.trim()} (${body.role}, @${username})`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/admin/staff, change role / reset password / activate (OWNER)
export async function PATCH(req: NextRequest) {
  try {
    const me = await requireStaff(req.headers.get("x-staff-token"), "OWNER");
    const body = (await req.json()) as { id: string; role?: string; password?: string; active?: boolean };
    const s = await db.staff.findUnique({ where: { id: body.id } });
    if (!s) throw new HttpError(404, "Staff not found.");
    const data: Record<string, unknown> = {};
    if (body.role) {
      if (!["OWNER", "MANAGER", "STAFF"].includes(body.role)) throw new HttpError(400, "Invalid role.");
      if (s.id === me.id && body.role !== "OWNER") throw new HttpError(400, "You cannot remove your own owner role.");
      data.role = body.role;
    }
    if (body.password) {
      if (body.password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
      data.passwordHash = hashSecret(body.password);
      data.token = null;
      data.tokenExpiresAt = null;
    }
    if (body.active !== undefined) {
      if (s.id === me.id && !body.active) throw new HttpError(400, "You cannot deactivate yourself.");
      data.active = !!body.active;
      if (!body.active) {
        data.token = null;
        data.tokenExpiresAt = null;
      }
    }
    await db.staff.update({ where: { id: body.id }, data });
    await audit(me.name, "STAFF_UPDATE", `@${s.username}, ${Object.keys(data).join(", ")}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
