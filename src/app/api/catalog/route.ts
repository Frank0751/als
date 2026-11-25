import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CatalogDTO } from "@/lib/als/types";
import type { PriceTier } from "@/lib/als/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const [products, reviews, collectionDates, deliveryAreas, courses, contentRows] =
    await Promise.all([
      db.product.findMany({ where: { active: true }, orderBy: [{ kind: "asc" }, { featured: "desc" }, { price: "asc" }] }),
      db.review.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
      db.collectionDate.findMany({ where: { date: { gte: today }, isOpen: true }, orderBy: { date: "asc" } }),
      db.deliveryArea.findMany({ orderBy: { fee: "asc" } }),
      db.trainingCourse.findMany({ where: { active: true }, orderBy: { fee: "asc" } }),
      db.siteContent.findMany(),
    ]);

  const courseIds = courses.map((c) => c.id);
  const sessions = await db.trainingSession.findMany({
    where: { courseId: { in: courseIds }, date: { gte: today } },
    orderBy: { date: "asc" },
  });

  const dto: CatalogDTO = {
    products: products.map((p) => ({
      ...p,
      priceTiers: p.priceTiers ? (JSON.parse(p.priceTiers) as PriceTier[]) : null,
      createdAt: undefined,
      updatedAt: undefined,
    })) as unknown as CatalogDTO["products"],
    reviews,
    collectionDates,
    deliveryAreas,
    courses: courses.map((c) => ({
      ...c,
      covers: JSON.parse(c.covers) as string[],
      sessions: sessions.filter((s) => s.courseId === c.id),
    })),
    content: Object.fromEntries(contentRows.map((r) => [r.key, r.value])),
  };

  return NextResponse.json(dto);
}
