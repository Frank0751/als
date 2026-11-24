"use client";

// Our Farm & Impact — the ALS story, written from the company's own words

import { useCatalog } from "../catalog-context";
import { useRoute } from "@/lib/als/store";
import { SectionTitle } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Fish, Waves, Leaf, Users, GraduationCap } from "lucide-react";

export default function FarmView({ impact = false }: { impact?: boolean }) {
  const { content } = useCatalog();
  const { navigate } = useRoute();
  const story = (content("farm.story") || "").split("\n").filter(Boolean);
  const impactText = (content("farm.impact") || "").split("\n").filter(Boolean);

  return (
    <div>
      <section className="relative">
        { }
        <img src="/images/farm-ponds.png" alt="The ALS farm in Akuse — rows of tilapia ponds" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Akuse, Eastern Region · since 2009</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-4xl">{impact ? "Our impact" : "Our farm"}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {!impact ? (
          <>
            <SectionTitle
              eyebrow="About Aquatic Link Solutions"
              title="A hatchery at Akuse, cages on the Volta River"
            />
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {story.map((p, i) => <p key={i}>{p}</p>)}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Fish, title: "Fingerlings — our primary business", text: "We produce and sell high-quality tilapia fingerlings: young fish past the fry stage, ready for stocking in ponds and cage systems. Farmers raise them to market size." },
                { icon: Waves, title: "Grow-out on the Volta", text: "We raise our own tilapia from fingerling to market size in cage systems on the Volta River — every practice we teach, we use ourselves." },
                { icon: Leaf, title: "Sustainable fish farming", text: "Quality stocking materials, careful grading and honest advice cut early losses and lift farm incomes across Ghana." },
                { icon: Users, title: "Women at the centre", text: "About 70% of our customers are women. Our platform, our photos and our training show women farming." },
              ].map((b) => (
                <Card key={b.title}>
                  <CardContent className="p-5">
                    <b.icon className="h-6 w-6 text-teal-700" aria-hidden="true" />
                    <h3 className="mt-3 font-bold">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            { }
            <img src="/images/training.png" alt="ALS training session with women and men farmers" className="mt-8 w-full rounded-2xl border object-cover" />

            <div className={cn("mt-8 rounded-2xl border bg-teal-50 p-6")}>
              <GraduationCap className="h-7 w-7 text-teal-700" aria-hidden="true" />
              <h3 className="mt-2 text-lg font-bold">Learn from the farm itself</h3>
              <p className="mt-1 text-sm text-muted-foreground">On-farm practicals, seminars, workshops and live online courses — for complete beginners and working farmers.</p>
              <Button className="mt-4 rounded-full" onClick={() => navigate("training")}>See training dates</Button>
            </div>
          </>
        ) : (
          <>
            <SectionTitle eyebrow="Impact" title="What 17 years of fingerlings add up to" />
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {impactText.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { k: "17+", v: "years of continuous production" },
                { k: "70%", v: "of customers are women" },
                { k: "7", v: "regions reached with delivery" },
              ].map((s) => (
                <Card key={s.v}>
                  <CardContent className="p-5 text-center">
                    <p className="text-3xl font-extrabold text-teal-800">{s.k}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.v}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            { }
            <img src="/images/harvest.png" alt="A rich tilapia harvest" className="mt-8 w-full rounded-2xl border object-cover" />
            <p className="mt-6 text-xs text-muted-foreground">
              Two or three customer stories are published here with permission — send yours to ALS and it may be the next one.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
