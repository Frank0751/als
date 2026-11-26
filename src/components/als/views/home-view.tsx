"use client";

// Home: who ALS is in one sentence, the operation in pictures, fingerlings,
// grow-out, training, impact, partner CTA (CLAUDE.md section 3)

import { useCatalog } from "../catalog-context";
import { useRoute } from "@/lib/als/store";
import { ProductImage, SectionTitle, StockPill } from "../ui-bits";
import { ghs, ghsShort } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtDate } from "@/lib/als/format";
import { ArrowRight } from "lucide-react";

export default function HomeView() {
  const { catalog, content } = useCatalog();
  const { navigate } = useRoute();
  if (!catalog) return null;

  const fingerlings = catalog.products.filter((p) => p.kind === "FINGERLING" && p.featured);
  const featuredFingerling = fingerlings[0];
  const otherFingerlings = fingerlings.slice(1, 3);
  const featuredMarket = catalog.products.filter((p) => p.kind === "MARKET" && p.featured).slice(0, 4);
  const courses = catalog.courses.slice(0, 3);
  const nextDate = catalog.collectionDates[0];
  const categories = [...new Set(catalog.products.filter((p) => p.kind === "MARKET").map((p) => p.category))];

  const steps = [
    { title: "Build your request list", text: "Pick fingerlings, sizes and quantities, plus any equipment you need, at the prices shown." },
    { title: "Add your details", text: "Name, phone, delivery or farm pickup, and an open collection date." },
    { title: "Send on WhatsApp", text: "One tap opens WhatsApp with the whole request typed in. It is saved with ALS the moment it is created." },
    { title: "ALS confirms", text: "We confirm availability on WhatsApp or by phone, then agree payment directly. Nothing is charged on this site." },
    { title: "Collect or take delivery", text: "Fingerlings travel in oxygen-bagged lots on dates ALS opens, with a receipt you can verify online." },
  ];

  return (
    <div>
      {/* hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src="/images/hero-women.png"
            alt="Women fish farmers harvesting tilapia at the ALS farm in Akuse"
            width={1344}
            height={768}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/70 to-teal-900/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            {content("home.hero_title") || "Quality tilapia fingerlings from our hatchery at Akuse, Eastern Region"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-teal-50/90 sm:text-lg">
            {content("home.hero_sub")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded bg-amber-500 px-6 text-base font-semibold text-stone-900 hover:bg-amber-600" onClick={() => navigate("fingerlings")}>
              Fingerlings availability
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("partner")}>
              Partner with ALS
            </Button>
          </div>
          {nextDate && (
            <p className="mt-6 inline-block rounded border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm">
              Next collection and delivery date: <b>{fmtDate(nextDate.date)}</b>
            </p>
          )}
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <SectionTitle
          title="How ordering works"
          sub="No account is needed, and nothing is charged on this site. Every request is saved with ALS and confirmed by our team on WhatsApp or by phone."
        />
        <ol className="mx-auto max-w-3xl">
          {steps.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b py-4 last:border-b-0">
              <span className="tnum font-serif text-2xl font-bold text-amber-500" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="text-left font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* fingerlings */}
      <section className="border-y bg-teal-50/60">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <SectionTitle
            title="Tilapia fingerlings, our primary business"
            sub="Young fish raised past the fry stage, graded at our hatchery in Akuse and ready for stocking in ponds and cage systems. Demand runs ahead of supply, so orders are scheduled by production cycle."
          />
          {featuredFingerling && (
            <div className="mt-6 grid gap-5 rounded border bg-[#FDFCF8] p-4 sm:grid-cols-5 sm:p-6">
              <ProductImage src={featuredFingerling.imageUrl} alt={featuredFingerling.name} kind={featuredFingerling.kind} className="h-56 w-full rounded object-cover sm:col-span-2 sm:h-full" />
              <div className="flex flex-col justify-center sm:col-span-3">
                <h3 className="text-left text-xl font-semibold">{featuredFingerling.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{featuredFingerling.spec}</p>
                <p className="mt-3 text-2xl font-bold text-teal-800">
                  {ghs(featuredFingerling.price)}<span className="text-sm font-medium text-muted-foreground"> /{featuredFingerling.unit}</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StockPill stock={featuredFingerling.stock} unit={featuredFingerling.unit} />
                  <Button className="rounded bg-teal-800 hover:bg-teal-700" onClick={() => navigate("fingerlings")}>
                    Choose size and quantity <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {otherFingerlings.map((p) => (
              <div key={p.id} className="flex gap-4 rounded border bg-[#FDFCF8] p-4">
                <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-28 w-28 shrink-0 rounded object-cover" />
                <div className="flex min-w-0 flex-col justify-center">
                  <h3 className="text-left font-semibold leading-snug">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.spec}</p>
                  <p className="mt-2 font-bold text-teal-800">{ghs(p.price)}<span className="text-xs font-medium text-muted-foreground"> /{p.unit}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* marketplace categories */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <SectionTitle
          title="The marketplace, equipment fish farmers actually need"
          sub="Nets, harvesting gear, feed accessories, aeration and safety kit, tested on our own ponds and cages. Ordered the same way: request list, then WhatsApp."
        />
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => navigate("market", { category: c })} className="rounded border bg-[#FDFCF8] px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-teal-600 hover:text-teal-800">
              {c}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredMarket.map((p) => (
            <Card key={p.id} className="overflow-hidden pt-0">
              <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-36 w-full" />
              <CardContent className="p-4">
                <h3 className="text-sm font-bold leading-snug">{p.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-bold text-teal-800">{ghsShort(p.price)}</p>
                  <StockPill stock={p.stock} unit={p.unit} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button variant="outline" className="rounded border-teal-800 text-teal-800 hover:bg-teal-50" onClick={() => navigate("market")}>
            Open the marketplace <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* story */}
      <section className="border-y bg-[#FDFCF8]">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <SectionTitle title="From the hatchery in Akuse to cages on the Volta" />
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{content("home.about_intro")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><b>Primary business:</b> production and sale of high-quality tilapia fingerlings for pond and cage farmers.</li>
              <li><b>Grow-out:</b> we raise tilapia from fingerling to market size in cage systems on the Volta River.</li>
              <li><b>Our mission:</b> supply quality stocking materials, promote sustainable fish farming and grow Ghana&rsquo;s aquaculture industry.</li>
              <li><b>Training:</b> free, with a focus on women and persons with disabilities, open to everyone.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded bg-teal-800 hover:bg-teal-700" onClick={() => navigate("operations")}>Our operations</Button>
              <Button variant="outline" className="rounded border-teal-800 text-teal-800 hover:bg-teal-50" onClick={() => navigate("apply")}>
                Apply to train, free
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <img src="/images/farm-ponds.png" alt="ALS fish ponds at the farm in Akuse" width={1344} height={768} loading="lazy" decoding="async" className="h-56 w-full rounded object-cover sm:h-full" />
            <img src="/images/harvest.png" alt="Tilapia harvested from the cages on the Volta River" width={1344} height={768} loading="lazy" decoding="async" className="h-56 w-full rounded object-cover sm:mt-8 sm:h-full" />
          </div>
        </div>
      </section>

      {/* training */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
        <SectionTitle
          title="Free training, on the farm and online"
          sub="Anyone can apply. Women and persons with disabilities are prioritised. On-farm sessions happen at Akuse, and people who cannot travel learn through structured video modules on this site."
        />
        <ul className="mx-auto max-w-3xl space-y-3">
          {courses.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded border bg-[#FDFCF8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-left font-semibold leading-snug">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.durationText} · free of charge</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 rounded border-teal-800 text-teal-800 hover:bg-teal-50" onClick={() => navigate("training")}>
                Course details
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-6 text-center">
          <Button className="rounded bg-amber-500 px-6 font-semibold text-stone-900 hover:bg-amber-600" onClick={() => navigate("apply")}>
            Apply to train
          </Button>
        </div>
      </section>

      {/* impact + partner CTA */}
      <section className="bg-teal-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:py-24">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">One target: over 1,000 people trained in four years</h2>
          <p className="mx-auto mt-3 max-w-2xl text-teal-100/85">
            ALS has committed to training more than 1,000 people in fish farming within four years, with a focus on women and persons with disabilities. Applications from this platform count toward that target, and partners can follow the progress on our Impact page.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12 rounded bg-amber-500 px-6 text-base font-semibold text-stone-900 hover:bg-amber-600" onClick={() => navigate("impact")}>
              See our impact
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("partner")}>
              Partner and invest
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
