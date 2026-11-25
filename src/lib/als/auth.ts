// Server-side auth helpers for the ALS platform
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

export function hashSecret(secret: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = scryptSync(secret, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifySecret(secret: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const test = scryptSync(secret, salt, 32);
    const orig = Buffer.from(hash, "hex");
    return orig.length === test.length && timingSafeEqual(test, orig);
  } catch {
    return false;
  }
}

export function sha(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function receiptCode(): string {
  return `ALS-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export type StaffRow = { id: string; username: string; name: string; role: string };

const ROLE_RANK: Record<string, number> = { STAFF: 1, MANAGER: 2, OWNER: 3 };

export async function staffFromToken(token: string | null | undefined): Promise<StaffRow | null> {
  if (!token) return null;
  const s = await db.staff.findFirst({
    where: { token, active: true, tokenExpiresAt: { gt: new Date() } },
  });
  if (!s) return null;
  return { id: s.id, username: s.username, name: s.name, role: s.role };
}

export async function requireStaff(
  token: string | null | undefined,
  minRole: "STAFF" | "MANAGER" | "OWNER" = "STAFF"
): Promise<StaffRow> {
  const s = await staffFromToken(token);
  if (!s) throw new HttpError(401, "Please sign in as ALS staff.");
  if (ROLE_RANK[s.role] < ROLE_RANK[minRole])
    throw new HttpError(403, "Your login does not allow this action.");
  return s;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(e: unknown): { ok: false; error: string; status: number } {
  if (e instanceof HttpError) return { ok: false, error: e.message, status: e.status };
  console.error(e);
  return { ok: false, error: "Something went wrong on the server.", status: 500 };
}

export async function audit(actor: string, action: string, detail: string) {
  await db.auditLog.create({ data: { actor, action, detail } });
}

// customer token: deterministic from stored pin hash + phone (recomputable server-side)
export function customerToken(pinHash: string, phone: string): string {
  return sha(`als-customer|${pinHash}|${phone}`);
}
