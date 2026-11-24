import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff } from "@/lib/als/auth";
import type { AuditDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/audit — who changed what
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    const dto: AuditDTO[] = rows.map((a) => ({
      id: a.id,
      actor: a.actor,
      action: a.action,
      detail: a.detail,
      createdAt: a.createdAt.toISOString(),
    }));
    return NextResponse.json({ audit: dto });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
