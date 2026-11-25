import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError, requireStaff } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/proof/[id], serve an uploaded payment proof (staff only)
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const { id } = await ctx.params;
    const p = await db.proofFile.findUnique({ where: { id } });
    if (!p) throw new HttpError(404, "Proof not found.");
    return NextResponse.json({ name: p.name, dataUrl: p.dataUrl, uploadedAt: p.uploadedAt.toISOString() });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
