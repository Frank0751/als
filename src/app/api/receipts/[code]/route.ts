import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

// GET /api/receipts/[code] — public receipt verification
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;
    if (!code?.trim()) throw new HttpError(400, "Enter a receipt code.");
    const order = await db.order.findUnique({ where: { receiptCode: code.trim().toUpperCase() } });
    if (!order || !order.receiptCode) {
      return NextResponse.json({ valid: false, message: "No receipt found with that code. Check the code or contact ALS." });
    }
    const name = order.customerName.trim();
    const parts = name.split(/\s+/);
    const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : name;
    return NextResponse.json({
      valid: true,
      orderNumber: order.orderNumber,
      issuedTo: shortName,
      total: order.total,
      status: order.status,
      issuedAt: order.receiptIssuedAt ? order.receiptIssuedAt.toISOString() : order.createdAt.toISOString(),
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
