"use client";

// Training: the free programme, who it is for, formats, how it works, apply CTA
// (CLAUDE.md section 3, 5. Training is free, no prices anywhere in training.)

import { useCatalog } from "../catalog-context";
import { useRoute } from "@/lib/als/store";
import { ProductImage, SectionTitle } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function typeLabel(t: string): string {
  switch (t) {
    case "ON_FARM": return "On-farm practical";
    case "SEMINAR": return "Seminar";
    case "WORKSHOP": return "Workshop";
    case "ONLINE": return "Online video modules";
    default: return t;
  }
}

const STEPS = [
  ["Apply, free", "Open Apply to train and fill in the short form. Training costs nothing, and there are no prices to check."],
  ["ALS reviews", "Our team reviews every application and replies by phone or WhatsApp. Applications carry a reference so nothing gets lost."],
  ["Get accepted", "Accepted trainees join on-farm training at Akuse, or are signed up for the online video programme if travel is hard."],
  ["Learn and practise", "On the farm you handle fish, water and feed with our team. Online, video modules open in order, each with a written summary, downloadable notes and captions."],
];

export default function TrainingView() {
  const { catalog } = useCatalog();
  const { navigate } = useRoute();
  if (!catalog) return null;

  return (
    <div>
      <section className="relative">
        <img src="/images/training.png" alt="Farmers practising fish handling at an ALS training session" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-4xl">Training with ALS</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <SectionTitle
          title="Free fish farming training, for anyone ready to learn"
          sub="ALS trains people in fish farming with a focus on women and persons with disabilities, and the programme is open to everyone. Training is free, on the farm at Akuse or at home through structured online video modules."
        />

        <SectionTitle title="How it works" />
        <ol className="space-y-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2rem_1fr] gap-3 rounded border bg-[#FDFCF8] p-4">
              <span className="tnum font-serif text-xl font-bold text-amber-500" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="text-left font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 text-center">
          <Button size="lg" className="min-h-11 rounded bg-amber-500 px-8 text-base font-semibold text-stone-900 hover:bg-amber-600" onClick={() => navigate("apply")}>
            Apply to train
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Takes about three minutes. You get an application reference straight away.</p>
        </div>

        <SectionTitle title="What the programme covers" />
        <div className="space-y-5">
          {catalog.courses.map((c) => (
            <div key={c.id} className="grid gap-4 rounded border bg-[#FDFCF8] p-4 sm:grid-cols-5">
              <ProductImage src={c.imageUrl} alt={c.title} kind="TRAINING" className="h-36 w-full rounded object-cover sm:col-span-2 sm:h-full" />
              <div className="sm:col-span-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-teal-800 text-white hover:bg-teal-800">{typeLabel(c.type)}</Badge>
                  <span className="text-xs text-muted-foreground">{c.durationText}</span>
                </div>
                <h3 className="mt-2 text-left text-lg font-semibold leading-snug">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {c.covers.map((x) => <li key={x}>· {x}</li>)}
                </ul>
                <p className="mt-2 text-sm font-semibold text-teal-800">Free of charge</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded border bg-[#FDFCF8] p-5 text-center">
          <h3 className="text-lg font-semibold">Learning online</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            The online programme is built for low-cost Android phones and slow data: videos show their size, notes can be read without the video, and every video carries captions. Accepted online trainees receive their sign-in details from ALS after review.
          </p>
        </div>

        <div className="mt-6 rounded border bg-[#FDFCF8] p-5 text-center">
          <p className="font-semibold">Training a group or cooperative?</p>
          <p className="mt-1 text-sm text-muted-foreground">ALS runs sessions for groups. Mention your group in the application, or contact us directly.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded border-teal-800 text-teal-800 hover:bg-teal-50" onClick={() => navigate("apply")}>Apply as an individual</Button>
            <Button variant="outline" className="rounded border-teal-800 text-teal-800 hover:bg-teal-50" onClick={() => navigate("contact")}>Contact ALS</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
