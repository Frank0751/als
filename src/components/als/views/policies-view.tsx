"use client";

// Policies: privacy, terms of sale, refunds, accessibility statement (drafted for ALS)

import { useCatalog } from "../catalog-context";
import { SectionTitle } from "../ui-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { waLink } from "@/lib/als/format";
import { useRoute } from "@/lib/als/store";

const ACCESSIBILITY: [string, string][] = [
  ["Keyboard use", "Every interactive element, menus, buttons, forms, tabs and dialogs, can be reached and operated with a keyboard alone, in a logical order, with a clearly visible focus outline."],
  ["Captions on training video", "Every training video carries captions. This is required by our own standard, not an extra, because the programme exists for persons with disabilities too. Written summaries and downloadable notes are provided so lessons can be followed without playing the video."],
  ["Contrast and text size", "Text and background colour pairs are checked for WCAG AA contrast, and the interface uses generous text sizes. The site respects the text-size settings of your phone or browser."],
  ["Motion", "Animation is subtle and purposeful, and the site fully respects the reduced-motion setting on your device."],
  ["Tap targets and touch", "Buttons and controls are at least 44 pixels tall, so they are comfortable to use on a small phone with one hand. Forms use large inputs and the site never zooms unexpectedly."],
  ["Images and structure", "Content images carry descriptive alternative text, headings follow a logical order, and landmarks let screen readers move between header, main content and footer."],
  ["Plain language", "Copy is written in plain English so it works for a foreign investor and a first-time farmer on a phone alike. A second language, Twi, is planned later."],
];

export default function PoliciesView({ tab = "privacy" }: { tab?: string }) {
  const { content } = useCatalog();
  const { navigate } = useRoute();
  const wa = content("contact.whatsapp_1");
  const email = content("contact.email");
  const para = (key: string) =>
    (content(key) || "").split("\n").filter(Boolean).map((p, i) => (
      <p key={i} className={p.match(/^\d+\./) ? "mt-3 font-medium text-foreground" : ""}>{p}</p>
    ));
  const report = () => navigate("contact");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <SectionTitle
        title="Policies and accessibility"
        sub="Drafted for ALS to review. Questions about any of it are welcome on WhatsApp."
      />
      <Tabs defaultValue={tab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="refund">Refunds</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>
        <TabsContent value="privacy" className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {para("policies.privacy")}
        </TabsContent>
        <TabsContent value="terms" className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {para("policies.terms")}
        </TabsContent>
        <TabsContent value="refund" className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {para("policies.refund")}
        </TabsContent>
        <TabsContent value="accessibility" className="mt-4 space-y-4">
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Aquatic Link Solutions wants this site to work for everybody, including people using screen readers, keyboard-only navigation, small phones, slow connections, and deaf or hard-of-hearing trainees. The site follows WCAG 2.2 level AA as its standard.
            </p>
            <p>What the site does today:</p>
          </div>
          <ul className="space-y-3">
            {ACCESSIBILITY.map(([t, d]) => (
              <li key={t} className="rounded border bg-[#FDFCF8] p-4">
                <h3 className="text-left text-base font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
          <div className="rounded border bg-[#FDFCF8] p-5">
            <h3 className="text-left text-base font-semibold">Found a barrier? Tell us.</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              If anything on this site is hard or impossible for you to use, ALS wants to know and will fix it. Describe what happened and where.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={report} className="rounded border border-teal-800 px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50">Use the contact form</button>
              {email && <a href={`mailto:${email}?subject=Accessibility problem on the ALS website`} className="rounded border border-teal-800 px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50">Email us</a>}
              {wa && <a href={waLink(wa, "Hello ALS, I found an accessibility problem on your website.")} target="_blank" rel="noreferrer" className="rounded border border-teal-800 px-4 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50">WhatsApp us</a>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
