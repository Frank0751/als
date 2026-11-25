"use client";

// About ALS: story, mission, leadership, values, registration details (CLAUDE.md section 3)

import { useCatalog } from "../catalog-context";
import { useRoute } from "@/lib/als/store";
import { SectionTitle } from "../ui-bits";
import { Button } from "@/components/ui/button";

export default function AboutView() {
  const { content } = useCatalog();
  const { navigate } = useRoute();
  const story = (content("farm.story") || "").split("\n").filter(Boolean);

  return (
    <div>
      <section className="relative">
        <img src="/images/hero-women.png" alt="Women fish farmers working with tilapia at the ALS farm" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-4xl">About Aquatic Link Solutions</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <SectionTitle title="A tilapia business at Akuse, on the Volta" />
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {story.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <SectionTitle title="Our mission" />
        <blockquote className="rounded border-l-4 border-amber-500 bg-[#FDFCF8] p-5 text-sm leading-relaxed sm:text-base">
          To supply quality stocking materials, promote sustainable fish farming, and contribute to the growth of Ghana&apos;s aquaculture industry.
        </blockquote>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          We work toward that mission from two sides. The hatchery supplies the fingerlings farmers need to stock ponds and cages. The training programme passes on what we practise ourselves, with a focus on women and persons with disabilities, open to everyone.
        </p>

        <SectionTitle title="What guides our work" />
        <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <li><strong className="text-foreground">Quality first.</strong> Fingerlings are graded carefully and sold only when they are strong enough to travel and grow. Nothing is sold before it is ready.</li>
          <li><strong className="text-foreground">Honest about demand.</strong> Orders are scheduled by production cycle. We say when fish will be ready instead of promising what we cannot supply.</li>
          <li><strong className="text-foreground">Teach what we practise.</strong> Every method we train is a method we use in our own ponds and cages on the Volta.</li>
          <li><strong className="text-foreground">Training that reaches people.</strong> Free training, on the farm and through structured online video, so distance and cost are not barriers.</li>
        </ul>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Leadership and team</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              [TO CONFIRM: leadership names, roles and photos. This section will introduce the people who run the hatchery, the cage grow-out and the training programme.]
            </p>
          </div>
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Registration details</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Aquatic Link Solutions (ALS), Akuse, Eastern Region, Ghana. Postal address: P.O. Box Akosombo.
              <br />
              [TO CONFIRM: business registration number and date of incorporation.]
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("partner")} className="min-h-11 rounded bg-amber-500 px-5 font-semibold text-stone-900 hover:bg-amber-600">
            Partner with us
          </Button>
          <Button variant="outline" onClick={() => navigate("operations")} className="min-h-11 rounded border-teal-800 px-5 text-teal-800 hover:bg-teal-50">
            See our operations
          </Button>
        </div>
      </div>
    </div>
  );
}
