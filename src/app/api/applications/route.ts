import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, requireStaff, HttpError } from "@/lib/als/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["RECEIVED", "UNDER_REVIEW", "ACCEPTED_FARM", "ACCEPTED_ONLINE", "WAITLISTED", "NOT_ACCEPTED"];

function refFor(seq: number): string {
  return `APL-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

// GET /api/applications: public count for the Impact page progress,
// or the full list for signed-in staff (Authorization header required).
export async function GET(req: NextRequest) {
  const staffToken = req.headers.get("x-staff-token");
  if (staffToken) {
    try {
      const staff = await requireStaff(req.headers.get("x-staff-token"), "STAFF");
      const apps = await db.trainingApplication.findMany({ orderBy: { createdAt: "desc" } });
      // Gender and disability answers are sensitive (CLAUDE.md section 9): only
      // the owner role receives them. The Supabase schema adds a trainer role
      // that will also see them; until then other roles get null.
      const seesSensitive = staff.role === "OWNER";
      return NextResponse.json({
        count: apps.length,
        applications: apps.map((a) => ({
          ...a,
          gender: seesSensitive ? a.gender : null,
          disability: seesSensitive ? a.disability : null,
          createdAt: a.createdAt.toISOString(),
        })),
        seesSensitive,
      });
    } catch {
      /* fall through to public count */
    }
  }
  const count = await db.trainingApplication.count();
  return NextResponse.json({ count });
}

// POST /api/applications: public application form (CLAUDE.md section 5)
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
    const fullName = str("fullName");
    const phone = str("phone");
    const gender = str("gender");
    const ageRange = str("ageRange");
    const region = str("region");
    const town = str("town");
    const experience = str("experience");
    const format = str("format");
    const email = str("email") || null;
    const source = str("source") || null;
    const disability = str("disability") || null;
    const consent = b.consent === true;

    if (!fullName) throw new HttpError(400, "Please enter your full name.");
    if (!phone) throw new HttpError(400, "Please enter the WhatsApp phone number to reach you on.");
    if (!gender) throw new HttpError(400, "Please choose a gender option.");
    if (!ageRange) throw new HttpError(400, "Please choose your age range.");
    if (!region) throw new HttpError(400, "Please choose your region.");
    if (!town) throw new HttpError(400, "Please enter your town or community.");
    if (!experience) throw new HttpError(400, "Please choose your fish farming experience.");
    if (!format) throw new HttpError(400, "Please choose your preferred training format.");
    if (!consent) throw new HttpError(400, "Please tick the consent box so ALS may store and review your application.");

    const seq = (await db.trainingApplication.count()) + 1;
    const ref = refFor(seq);
    const app = await db.trainingApplication.create({
      data: { ref, fullName, phone, email, gender, ageRange, region, town, experience, format, source, disability, consent },
    });
    return NextResponse.json({ ok: true, ref: app.ref });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/applications: staff updates a status or note
export async function PATCH(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const body = (await req.json()) as { id?: string; status?: string; notes?: string };
    if (!body.id) throw new HttpError(400, "Missing application id.");
    if (body.status && !STATUSES.includes(body.status)) throw new HttpError(400, "Unknown status.");
    const data: { status?: string; notes?: string } = {};
    if (body.status) data.status = body.status;
    if (typeof body.notes === "string") data.notes = body.notes;
    await db.trainingApplication.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
