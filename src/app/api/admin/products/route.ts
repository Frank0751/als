import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit, errorResponse, HttpError, requireStaff } from "@/lib/als/auth";
import type { PriceTier } from "@/lib/als/types";

export const dynamic = "force-dynamic";

// GET /api/admin/products, full catalogue incl. inactive
export async function GET(req: NextRequest) {
  try {
    await requireStaff(req.headers.get("x-staff-token"), "STAFF");
    const products = await db.product.findMany({ orderBy: [{ kind: "asc" }, { category: "asc" }, { name: "asc" }] });
    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        priceTiers: p.priceTiers ? (JSON.parse(p.priceTiers) as PriceTier[]) : null,
        createdAt: undefined,
        updatedAt: undefined,
      })),
    });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}

// PATCH /api/admin/products, update stock, price, active, featured
export async function PATCH(req: NextRequest) {
  try {
    const staff = await requireStaff(req.headers.get("x-staff-token"), "MANAGER");
    const body = (await req.json()) as { id: string; stock?: number; price?: number; active?: boolean; featured?: boolean };
    if (!body.id) throw new HttpError(400, "Missing product.");
    const p = await db.product.findUnique({ where: { id: body.id } });
    if (!p) throw new HttpError(404, "Product not found.");
    const data: Record<string, unknown> = {};
    if (body.stock !== undefined) {
      const stock = Math.floor(Number(body.stock));
      if (Number.isNaN(stock) || stock < 0) throw new HttpError(400, "Stock must be 0 or more.");
      data.stock = stock;
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (Number.isNaN(price) || price <= 0) throw new HttpError(400, "Price must be greater than 0.");
      data.price = price;
    }
    if (body.active !== undefined) data.active = !!body.active;
    if (body.featured !== undefined) data.featured = !!body.featured;
    await db.product.update({ where: { id: body.id }, data });
    await audit(staff.name, "PRODUCT_UPDATE", `${p.name}, ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(", ")}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(errorResponse(e), { status: errorResponse(e).status });
  }
}
