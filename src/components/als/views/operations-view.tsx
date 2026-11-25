"use client";

// Our Operations: hatchery, fingerling production, cage grow-out, quality and biosecurity, gallery

import { SectionTitle } from "../ui-bits";
import { useRoute } from "@/lib/als/store";
import { Button } from "@/components/ui/button";

const QUALITY = [
  ["Grading by size", "Fingerlings are graded regularly so farmers receive even batches. Even sizing reduces cannibalism and gives every farmer a level crop."],
  ["Water quality checks", "Dissolved oxygen, temperature and pH are checked before fish move. Fish travel only when water conditions and fish condition allow it."],
  ["Biosecurity between batches", "Equipment is disinfected between batches, visitors follow farm rules, and sick fish are isolated. Healthy broodstock means healthy fingerlings."],
  ["Oxygen-packed transport", "Fingerlings leave in oxygen-bagged lots with aeration for the road. Hand-over happens on dates ALS opens, nothing is sold before it is ready."],
];

export default function OperationsView() {
  const { navigate } = useRoute();

  return (
    <div>
      <section className="relative">
        <img src="/images/farm-ponds.png" alt="Rows of tilapia ponds at the ALS farm in Akuse" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-4xl">Our operations</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <SectionTitle title="The hatchery and fingerling production" />
        <div className="grid gap-6 sm:grid-cols-5">
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:col-span-3 sm:text-base">
            <p>
              Fingerlings are our primary business. In the hatchery at Akuse we spawn, hatch and rear tilapia past the fry stage to sizes farmers can stock straight into ponds and cages: fingerlings, juveniles and broodstock.
            </p>
            <p>
              Broodstock management, egg collection and hatching happen on site, and young fish are moved through nursery hapas as they grow. Every batch is graded before sale so the fish a farmer receives are even and ready to grow.
            </p>
            <p>
              Demand for quality fingerlings in Ghana runs ahead of supply. Orders are scheduled by production cycle, and we tell customers honestly when the next batch will be ready.
            </p>
          </div>
          <img src="/images/fingerlings.png" alt="Tilapia fingerlings in a hapa at the ALS hatchery" className="w-full rounded border object-cover sm:col-span-2" />
        </div>

        <SectionTitle title="Cage grow-out on the Volta River" />
        <div className="grid gap-6 sm:grid-cols-5">
          <img src="/images/harvest.png" alt="Tilapia harvested from the ALS cages on the Volta River" className="w-full rounded border object-cover sm:col-span-2" />
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:col-span-3 sm:text-base">
            <p>
              Alongside the hatchery, ALS raises its own tilapia from fingerling to market size in cage systems on the Volta River. The cages sit in open water where currents carry fresh oxygen through the nets.
            </p>
            <p>
              This grow-out operation is our proving ground. Feed rates, grading intervals, stocking densities and harvest practices are tested here first, then taught in our training. Farmers learn methods the farm itself depends on.
            </p>
          </div>
        </div>

        <SectionTitle title="Quality and biosecurity practices" />
        <ol className="space-y-4">
          {QUALITY.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2rem_1fr] gap-3 rounded border bg-[#FDFCF8] p-4">
              <span className="tnum font-serif text-xl font-bold text-amber-500" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="text-left text-base font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>

        <SectionTitle title="On the farm" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            ["/images/farm-ponds.png", "Pond rows at the Akuse farm"],
            ["/images/training.png", "A training session at the farm"],
            ["/images/hero-women.png", "Women farmers sorting a tilapia harvest"],
            ["/images/harvest.png", "A cage harvest on the Volta River"],
          ].map(([src, alt]) => (
            <img key={src + alt} src={src} alt={alt} className="h-40 w-full rounded border object-cover sm:h-56" />
          ))}
        </div>

        <div className="mt-10 rounded border bg-teal-800 p-6 text-center text-teal-50">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">See the operation yourself</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-teal-100">
            Farm visits for buyer groups, partners and training cohorts are arranged in advance through our contact lines.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("contact")} className="min-h-11 rounded bg-amber-500 px-5 font-semibold text-stone-900 hover:bg-amber-600">
              Arrange a visit
            </Button>
            <Button variant="outline" onClick={() => navigate("fingerlings")} className="min-h-11 rounded border-teal-200 bg-transparent px-5 text-teal-50 hover:bg-teal-900 hover:text-white">
              Fingerlings availability
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
