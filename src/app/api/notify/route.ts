import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

/** Shared spam guard: honeypot field + basic validation. */
function guard(body: Record<string, unknown>) {
  if (typeof body.website === "string" && body.website.trim() !== "")
    throw new HttpError(400, "Submission blocked."); // honeypot
}

// POST /api/notify, "Notify me" for out-of-stock products
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { productId: string; name: string; phone: string; website?: string };
    guard(body);
    if (!body.name?.trim()) throw new HttpError(400, "Please enter your name.");
    if (!body.phone?.trim() || body.phone.replace(/[^0-9]/g, "").length < 9)
      throw new HttpError(400, "Please enter a valid phone number.");
    const p = await db.product.findUnique({ where: { id: body.productId } });
    if (!p) throw new HttpError(404, "Product not found.");
    await db.notifyRequest.create({
      data: { productId: p.id, name: body.name.trim(), phone: body.phone.trim() },
    });
    return NextResponse.json({ ok: true, message: `Thank you ${body.name.trim().split(" ")[0]}! ALS will contact you on WhatsApp when “${p.name}” is back in stock.` });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
