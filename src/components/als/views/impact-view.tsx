"use client";

// Impact: the 1,000-trainees-in-4-years target with live progress from real data (CLAUDE.md section 3)

import { useEffect, useState } from "react";
import { SectionTitle, Spinner } from "../ui-bits";
import { useRoute } from "@/lib/als/store";
import { Button } from "@/components/ui/button";

export default function ImpactView() {
  const { navigate } = useRoute();
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setCount(typeof d.count === "number" ? d.count : 0))
      .catch(() => setFailed(true));
  }, []);

  const TARGET = 1000;
  const progress = count === null ? null : Math.min(100, Math.round((count / TARGET) * 1000) / 10);

  return (
    <div>
      <section className="relative">
        <img src="/images/training.png" alt="A training session at the ALS farm with women and men farmers" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-4xl">Impact</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <SectionTitle title="One thousand trained farmers in four years" />
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          ALS has set itself a target: train more than 1,000 people in fish farming within four years, with a focus on women and persons with disabilities. The number below comes from applications received on this platform, it grows as people apply.
        </p>

        <div className="mt-8 rounded border bg-[#FDFCF8] p-6 sm:p-8">
          <div className="text-center font-serif text-5xl font-bold text-teal-800 sm:text-6xl">
            {count === null ? <Spinner /> : <span className="tnum">{count.toLocaleString("en-US")}</span>}
          </div>
          <p className="mt-2 text-center text-sm font-medium text-muted-foreground">training applications received on this platform</p>
          <div className="mt-5" role="progressbar" aria-valuemin={0} aria-valuemax={TARGET} aria-valuenow={count ?? 0} aria-label="Progress toward the 1,000 trainee target">
            <div className="h-2.5 w-full overflow-hidden rounded bg-stone-200">
              <div className="h-full bg-amber-500" style={{ width: `${progress ?? 0}%` }} />
            </div>
          </div>
          <p className="tnum mt-2 text-center text-xs text-muted-foreground">
            {progress === null ? "" : `${progress}% of the 1,000 target`} · target set by ALS: 1,000+ people in 4 years
          </p>
          <p className="mt-4 text-center text-sm">
            <button onClick={() => navigate("apply")} className="font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-600">
              Apply to train, free
            </button>
          </p>
        </div>

        <SectionTitle title="Who ALS serves" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Women first</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Women do much of the fish farming work in Ghana, from pond management to processing and sale. ALS training puts women first in scheduling and outreach, and shows women farming in its own materials.
            </p>
          </div>
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Persons with disabilities</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The training programme is open to persons with disabilities. Online video learning with captions lets people learn from home, and the application asks voluntarily so ALS can plan access needs.
            </p>
          </div>
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Farmers across Ghana</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Fingerlings from the hatchery stock ponds and cage farms, from small backyard ponds to commercial cage operations along the Volta. Delivery reaches Akuse, Akosombo, Somanya, Koforidua, Tema, Accra and Kumasi.
            </p>
          </div>
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Ghana&apos;s aquaculture industry</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Poor fingerling supply is a named constraint in Ghana&apos;s national aquaculture plans. Every reliable batch ALS produces, and every farmer trained to grow it well, widens that bottleneck.
            </p>
          </div>
        </div>

        <SectionTitle title="The numbers behind the work" />
        <div className="space-y-3 rounded border bg-[#FDFCF8] p-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            [TO CONFIRM: years in operation, total fingerlings produced to date, number of farmers trained before this platform, jobs supported at the farm and through supply chains. ALS will supply these figures; they are shown here only once confirmed.]
          </p>
          <p>
            What ALS can already state: fingerling demand exceeds supply, training is free, and the 1,000-in-4-years target is the company&apos;s own commitment. Aggregated application statistics by region, gender and format are available to partners on request.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("partner")} className="min-h-11 rounded bg-amber-500 px-5 font-semibold text-stone-900 hover:bg-amber-600">
            Support the programme
          </Button>
          <Button variant="outline" onClick={() => navigate("training")} className="min-h-11 rounded border-teal-800 px-5 text-teal-800 hover:bg-teal-50">
            About the training
          </Button>
        </div>
      </div>
    </div>
  );
}
