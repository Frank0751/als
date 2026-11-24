import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff } from "@/lib/als/auth";
import type { BookingDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/trainees — bookings per session for the trainee lists
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const bookings = await db.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { session: { include: { course: true } } },
    });
    const dto: BookingDTO[] = bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      sessionId: b.sessionId,
      courseTitle: b.session.course.title,
      courseType: b.session.course.type,
      date: b.session.date,
      timeText: b.session.timeText,
      location: b.session.location,
      seats: b.seats,
      total: b.total,
      status: b.status,
      customerName: b.customerName,
      phone: b.phone,
      email: b.email,
      createdAt: b.createdAt.toISOString(),
    }));
    return NextResponse.json({ bookings: dto });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
