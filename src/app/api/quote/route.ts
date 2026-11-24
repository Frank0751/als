import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

// POST /api/quote — request a quote for very large fingerling orders
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name: string; org?: string; phone: string; email?: string; message: string; website?: string;
    };
    if (typeof body.website === "string" && body.website.trim() !== "") throw new HttpError(400, "Submission blocked.");
    if (!body.name?.trim()) throw new HttpError(400, "Please enter your name.");
    if (!body.phone?.trim() || body.phone.replace(/[^0-9]/g, "").length < 9)
      throw new HttpError(400, "Please enter a valid phone number.");
    if (!body.message?.trim() || body.message.trim().length < 10)
      throw new HttpError(400, "Please tell us what you need (sizes and quantities).");
    await db.quoteRequest.create({
      data: {
        name: body.name.trim(),
        org: body.org?.trim() || null,
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        message: body.message.trim(),
      },
    });
    return NextResponse.json({ ok: true, message: "Your quote request has reached ALS. We reply within one working day." });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
