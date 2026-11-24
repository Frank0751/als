import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, HttpError, requireStaff } from "@/lib/als/auth";
import type { CourseDTO } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/training — courses, sessions, bookings
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const [courses, sessions, bookings] = await Promise.all([
      db.trainingCourse.findMany({ orderBy: { title: "asc" } }),
      db.trainingSession.findMany({ orderBy: { date: "asc" } }),
      db.booking.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    const dto: CourseDTO[] = courses.map((c) => ({
      ...c,
      covers: JSON.parse(c.covers) as string[],
      createdAt: undefined,
      sessions: sessions.filter((s) => s.courseId === c.id),
    })) as unknown as CourseDTO[];
    return NextResponse.json({
      courses: dto,
      bookings: bookings.map((b) => ({
        id: b.id,
        reference: b.reference,
        sessionId: b.sessionId,
        customerName: b.customerName,
        phone: b.phone,
        email: b.email,
        seats: b.seats,
        total: b.total,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// POST /api/admin/training — add a session to a course
export async function POST(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as { courseId: string; date: string; timeText: string; location: string; seats: number };
    if (!body.courseId) throw new HttpError(400, "Pick a course.");
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.date ?? "")) throw new HttpError(400, "Pick a date.");
    if (!body.timeText?.trim()) throw new HttpError(400, "Enter the time (e.g. 9:00 AM – 3:00 PM).");
    if (!body.location?.trim()) throw new HttpError(400, "Enter the location.");
    const seats = Math.max(1, Math.floor(Number(body.seats ?? 15)));
    await db.trainingSession.create({
      data: { courseId: body.courseId, date: body.date, timeText: body.timeText.trim(), location: body.location.trim(), seats },
    });
    await audit(staff.name, "SESSION_ADD", `Course ${body.courseId.slice(-6)} — ${body.date} (${seats} seats)`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/admin/training — edit session or course fee/title
export async function PATCH(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as {
      kind: "session" | "course";
      id: string;
      date?: string; timeText?: string; location?: string; seats?: number;
      title?: string; fee?: number; active?: boolean;
    };
    if (body.kind === "session") {
      const s = await db.trainingSession.findUnique({ where: { id: body.id } });
      if (!s) throw new HttpError(404, "Session not found.");
      const data: Record<string, unknown> = {};
      if (body.date && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(body.date)) data.date = body.date;
      if (body.timeText?.trim()) data.timeText = body.timeText.trim();
      if (body.location?.trim()) data.location = body.location.trim();
      if (body.seats !== undefined) {
        const seats = Math.floor(Number(body.seats));
        if (Number.isNaN(seats) || seats < s.booked) throw new HttpError(400, `Seats cannot be less than the ${s.booked} already booked.`);
        data.seats = Math.max(1, seats);
      }
      await db.trainingSession.update({ where: { id: body.id }, data });
      await audit(staff.name, "SESSION_UPDATE", `${s.date} ${s.timeText} — ${Object.keys(data).join(", ")}`);
      return NextResponse.json({ ok: true });
    }
    if (body.kind === "course") {
      const c = await db.trainingCourse.findUnique({ where: { id: body.id } });
      if (!c) throw new HttpError(404, "Course not found.");
      const data: Record<string, unknown> = {};
      if (body.title?.trim()) data.title = body.title.trim();
      if (body.fee !== undefined) {
        const fee = Number(body.fee);
        if (Number.isNaN(fee) || fee < 0) throw new HttpError(400, "Fee must be 0 or more.");
        data.fee = fee;
      }
      if (body.active !== undefined) data.active = !!body.active;
      await db.trainingCourse.update({ where: { id: body.id }, data });
      await audit(staff.name, "COURSE_UPDATE", `${c.title} — ${Object.keys(data).join(", ")}`);
      return NextResponse.json({ ok: true });
    }
    throw new HttpError(400, "Unknown kind.");
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// DELETE /api/admin/training?id=... — delete a session with no bookings
export async function DELETE(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "Missing id.");
    const s = await db.trainingSession.findUnique({ where: { id }, include: { bookings: true } });
    if (!s) throw new HttpError(404, "Session not found.");
    if (s.bookings.length > 0) throw new HttpError(400, "This session has bookings — close it instead of deleting.");
    await db.trainingSession.delete({ where: { id } });
    await audit(staff.name, "SESSION_DELETE", `${s.date} ${s.timeText}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
