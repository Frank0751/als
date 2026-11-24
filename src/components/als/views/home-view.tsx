"use client";

// Home — the ALS storefront front page

import { useCatalog } from "../catalog-context";
import { useRoute } from "@/lib/als/store";
import { ProductImage, SectionTitle, Stars, StockPill } from "../ui-bits";
import { ghs, ghsShort } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Fish, ShoppingBag, GraduationCap, Send, ReceiptText,
  MapPin, ClipboardList, SearchCheck, Waves, Users, Award, Leaf,
} from "lucide-react";

export default function HomeView() {
  const { catalog, content } = useCatalog();
  const { navigate } = useRoute();
  if (!catalog) return null;

  const fingerlings = catalog.products.filter((p) => p.kind === "FINGERLING" && p.featured).slice(0, 3);
  const featuredMarket = catalog.products.filter((p) => p.kind === "MARKET" && p.featured).slice(0, 4);
  const courses = catalog.courses.slice(0, 3);
  const nextDate = catalog.collectionDates[0];
  const reviews = catalog.reviews.slice(0, 3);
  const categories = [...new Set(catalog.products.filter((p) => p.kind === "MARKET").map((p) => p.category))];

  const steps = [
    { icon: SearchCheck, title: "Browse", text: "See live availability, prices and the next collection date" },
    { icon: ShoppingBag, title: "Order", text: "Choose quantity, then delivery or farm pickup" },
    { icon: Send, title: "Send", text: "One tap sends the full order to ALS on WhatsApp" },
    { icon: ReceiptText, title: "Receipt", text: "Branded PDF once ALS confirms payment" },
    { icon: ClipboardList, title: "Track", text: "Follow each stage by order number and phone number" },
  ];

  return (
    <div>
      {/* hero */}
      <section className="relative">
        <div className="absolute inset-0">
          { }
          <img src="/images/hero-women.png" alt="Ghanaian women fish farmers harvesting tilapia at the ALS farm in Akuse" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/70 to-teal-900/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Badge className="bg-orange-500 text-white hover:bg-orange-500">Over 17 years of aquaculture · Akuse, Eastern Region</Badge>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {content("home.hero_title") || "Quality tilapia fingerlings, equipment and training — straight from our hatchery in Akuse"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-teal-50/90 sm:text-lg">
            {content("home.hero_sub")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 rounded-full px-6 text-base" onClick={() => navigate("fingerlings")}>
              <Fish className="h-5 w-5" aria-hidden="true" /> Order fingerlings
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white" onClick={() => navigate("market")}>
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Browse equipment
            </Button>
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3 text-white">
            {[
              { k: "17+", v: "years farming fish" },
              { k: "70%", v: "women customers" },
              { k: nextDate ? new Date(nextDate.date).getDate() + " " + new Date(nextDate.date).toLocaleString("en", { month: "short" }) : "—", v: "next collection date" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-sm">
                <dt className="text-2xl font-extrabold">{s.k}</dt>
                <dd className="text-xs text-teal-50/90">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* how it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <SectionTitle
          eyebrow="How it works"
          title="The same five steps for fingerlings, equipment and training"
          sub="No account is needed to order, so a first-time buyer is never turned away. Everything is saved, priced and tracked."
        />
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-xl border bg-white p-4">
              <span className="absolute right-3 top-3 text-3xl font-black text-teal-100">{i + 1}</span>
              <s.icon className="h-6 w-6 text-teal-700" aria-hidden="true" />
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* fingerlings */}
      <section className="border-y bg-teal-50/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Our primary business"
              title="Tilapia fingerlings — live availability"
              sub="Young fish raised past the fry stage, graded at our hatchery in Akuse and ready for stocking in ponds and cage systems on the Volta River."
            />
            <Button variant="outline" className="hidden shrink-0 rounded-full sm:inline-flex" onClick={() => navigate("fingerlings")}>
              All sizes <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fingerlings.map((p) => (
              <Card key={p.id} className="overflow-hidden pt-0">
                <div className="relative">
                  <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-44 w-full" />
                  <span className="absolute left-3 top-3"><Badge className="bg-teal-700 text-white hover:bg-teal-700">{p.category}</Badge></span>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold leading-snug">{p.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.spec}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-extrabold text-teal-800">{ghs(p.price)}<span className="text-xs font-medium text-muted-foreground"> /{p.unit}</span></p>
                      {p.priceTiers && <p className="text-xs text-muted-foreground">From {ghs(p.priceTiers[p.priceTiers.length - 1]!.price)} at {p.priceTiers[p.priceTiers.length - 1]!.label}</p>}
                    </div>
                    <StockPill stock={p.stock} unit={p.unit} />
                  </div>
                  <Button className="mt-3 w-full rounded-full" onClick={() => navigate("fingerlings")}>Choose quantity</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* marketplace categories */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <SectionTitle
          eyebrow="Marketplace"
          title="Nets, harvesting gear, feed accessories, aeration and safety"
          sub="The equipment fish farmers actually need — tested on our own ponds and cages."
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => navigate("market", { category: c })} className="rounded-full border bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-teal-600 hover:text-teal-800">
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
                  <p className="font-extrabold text-teal-800">{ghsShort(p.price)}</p>
                  <StockPill stock={p.stock} unit={p.unit} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => navigate("market")}>
          Open the marketplace <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </section>

      {/* story */}
      <section className="border-y bg-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:py-16 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="About ALS" title="From the hatchery in Akuse to cages on the Volta" />
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{content("home.about_intro")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex gap-3"><Fish className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><span><b>Primary specialisation:</b> production and sale of high-quality tilapia fingerlings for pond and cage farmers.</span></li>
              <li className="flex gap-3"><Waves className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><span><b>Grow-out:</b> we raise tilapia from fingerling to market size in cage systems on the Volta River.</span></li>
              <li className="flex gap-3"><Leaf className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><span><b>Our aim:</b> supply quality stocking materials, promote sustainable fish farming and grow Ghana&rsquo;s aquaculture industry.</span></li>
              <li className="flex gap-3"><Users className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><span><b>Community:</b> about 70% of our customers are women, and our training welcomes complete beginners.</span></li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-full" onClick={() => navigate("farm")}>Our farm &amp; impact</Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate("training")}>
                <GraduationCap className="h-4 w-4" aria-hidden="true" /> Train with ALS
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            { }
            <img src="/images/farm-ponds.png" alt="ALS fish ponds at the farm in Akuse" className="h-56 w-full rounded-xl object-cover sm:h-full sm:rounded-2xl" />
            { }
            <img src="/images/harvest.png" alt="Tilapia harvest with seine nets" className="h-56 w-full rounded-xl object-cover sm:mt-8 sm:h-full sm:rounded-2xl" />
          </div>
        </div>
      </section>

      {/* training */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle eyebrow="Training" title="Anybody can learn to farm fish with ALS" sub="On-farm practicals, seminars, workshops and live online courses — book an open date and your receipt is your admission slip." />
          <Button variant="outline" className="hidden shrink-0 rounded-full sm:inline-flex" onClick={() => navigate("training")}>All courses <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="flex flex-col overflow-hidden pt-0">
              <ProductImage src={c.imageUrl} alt={c.title} kind="TRAINING" className="h-40 w-full" />
              <CardContent className="flex flex-1 flex-col p-4">
                <Badge variant="outline" className="w-fit border-teal-200 bg-teal-50 text-teal-800">{c.type.replace("_", "-").toLowerCase()}</Badge>
                <h3 className="mt-2 font-bold leading-snug">{c.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.durationText}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-extrabold text-teal-800">{ghs(c.fee)}</p>
                  <Button size="sm" className="rounded-full" onClick={() => navigate("training")}>See dates</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* reviews */}
      <section className="border-t bg-teal-50/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionTitle eyebrow="Real customers" title="Farms that grow with ALS" sub="Verified reviews from buyers of our fingerlings and equipment." />
          <div className="grid gap-4 sm:grid-cols-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-5">
                <Stars rating={r.rating} />
                <p className="mt-3 text-sm leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">{r.name} — {r.location}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="bg-teal-950">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <Award className="mx-auto h-8 w-8 text-amber-400" aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">For 17 years, customers have trusted ALS enough to recommend it.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-teal-100/85">
            Now that trust is online: real photos, clear prices, live stock, receipts you can verify and orders you can track — from Akuse to Oslo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-12 rounded-full bg-orange-600 px-6 text-base hover:bg-orange-700" onClick={() => navigate("fingerlings")}>
              Start your order <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-full border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("track")}>
              <MapPin className="h-5 w-5" aria-hidden="true" /> Track an order
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
