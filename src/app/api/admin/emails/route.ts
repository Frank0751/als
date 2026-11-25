import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff } from "@/lib/als/auth";
import type { EmailDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/emails, the outbound order-email log
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const rows = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    const dto: EmailDTO[] = rows.map((e) => ({
      id: e.id,
      toEmail: e.toEmail,
      subject: e.subject,
      body: e.body,
      kind: e.kind,
      createdAt: e.createdAt.toISOString(),
    }));
    return NextResponse.json({ emails: dto });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
