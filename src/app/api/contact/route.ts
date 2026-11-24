import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

// POST /api/contact — secure contact form with spam protection
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name: string; email?: string; phone?: string; subject: string; message: string; website?: string;
    };
    if (typeof body.website === "string" && body.website.trim() !== "") throw new HttpError(400, "Submission blocked.");
    if (!body.name?.trim()) throw new HttpError(400, "Please enter your name.");
    if (!body.email?.trim() && !body.phone?.trim())
      throw new HttpError(400, "Please give us an email or a phone number to reply to.");
    if (!body.subject?.trim()) throw new HttpError(400, "Please choose a subject.");
    if (!body.message?.trim() || body.message.trim().length < 10)
      throw new HttpError(400, "Please write your message (at least 10 characters).");
    await db.contactMessage.create({
      data: {
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        subject: body.subject.trim(),
        message: body.message.trim(),
      },
    });
    return NextResponse.json({ ok: true, message: "Your message has reached ALS. We reply within one working day." });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
