"use client";

// Policies — privacy, terms of sale, refund policy (drafted for ALS)

import { useCatalog } from "../catalog-context";
import { SectionTitle } from "../ui-bits";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliciesView() {
  const { content } = useCatalog();
  const para = (key: string) =>
    (content(key) || "").split("\n").filter(Boolean).map((p, i) => (
      <p key={i} className={p.match(/^\d+\./) ? "mt-3 font-medium text-foreground" : ""}>{p}</p>
    ));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="The fine print, in plain language"
        title="Privacy, terms of sale and refunds"
        sub="Drafted for ALS to review. Questions about any of it are welcome on WhatsApp."
      />
      <Tabs defaultValue="privacy">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="terms">Terms of sale</TabsTrigger>
          <TabsTrigger value="refund">Refunds</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
