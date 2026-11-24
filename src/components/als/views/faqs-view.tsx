"use client";

// FAQs — plain answers for complete beginners

import { useCatalog } from "../catalog-context";
import { SectionTitle } from "../ui-bits";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy } from "lucide-react";

export default function FaqsView() {
  const { content } = useCatalog();
  let faqs: { q: string; a: string }[] = [];
  try {
    faqs = JSON.parse(content("faqs") || "[]");
  } catch {
    faqs = [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="Help centre"
        title="Frequently asked questions"
        sub="Short, plain answers. Anything else — message ALS on WhatsApp from the button at the bottom of every page."
      />
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-8 flex items-start gap-3 rounded-2xl border bg-teal-50 p-5">
        <LifeBuoy className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
        <div>
          <p className="font-bold">Still stuck?</p>
          <p className="mt-1 text-sm text-muted-foreground">ALS replies on WhatsApp within working hours (Monday–Saturday, 8:00 AM–5:00 PM). If you are new to fish farming, the Starter Seminar is the best place to begin.</p>
        </div>
      </div>
    </div>
  );
}
