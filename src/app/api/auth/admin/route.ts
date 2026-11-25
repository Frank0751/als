import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError, verifySecret } from "@/lib/als/auth";
import type { StaffDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// POST /api/auth/admin, staff sign-in, returns a 12-hour token
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username: string; password: string };
    if (!body.username?.trim() || !body.password) throw new HttpError(400, "Enter your username and password.");
    const s = await db.staff.findUnique({ where: { username: body.username.trim().toLowerCase() } });
    if (!s || !s.active || !verifySecret(body.password, s.passwordHash))
      throw new HttpError(401, "Wrong username or password.");
    const token = `${s.id}.${Date.now().toString(36)}.${crypto.randomUUID().replace(/-/g, "")}`;
    const expires = new Date(Date.now() + 12 * 3600 * 1000);
    await db.staff.update({ where: { id: s.id }, data: { token, tokenExpiresAt: expires } });
    const staff: StaffDTO = { id: s.id, username: s.username, name: s.name, role: s.role };
    return NextResponse.json({ staff, token });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
