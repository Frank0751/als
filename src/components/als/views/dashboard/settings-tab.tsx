"use client";

// Content & areas, ALS edits page text, FAQs, policies, contact info and delivery fees itself

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const GROUPS: { title: string; keys: { key: string; label: string; long?: boolean }[] }[] = [
  {
    title: "Home page",
    keys: [
      { key: "home.hero_title", label: "Hero headline" },
      { key: "home.hero_sub", label: "Hero sub-text", long: true },
      { key: "home.about_intro", label: "About intro", long: true },
    ],
  },
  {
    title: "Our Farm & Impact",
    keys: [
      { key: "farm.story", label: "Our farm story (blank line = new paragraph)", long: true },
      { key: "farm.impact", label: "Impact text", long: true },
    ],
  },
  {
    title: "Contact details",
    keys: [
      { key: "contact.whatsapp_1", label: "WhatsApp line 1" },
      { key: "contact.whatsapp_2", label: "WhatsApp line 2" },
      { key: "contact.whatsapp_orders", label: "WhatsApp number orders go to" },
      { key: "contact.email", label: "General email" },
      { key: "contact.orders_email", label: "Orders email" },
      { key: "contact.phone", label: "Phone" },
      { key: "contact.location", label: "Location" },
      { key: "contact.hours", label: "Opening hours" },
    ],
  },
  {
    title: "Payment accounts customers pay into",
    keys: [
      { key: "payment.momo", label: "MoMo details", long: true },
      { key: "payment.bank", label: "Bank (GHS) details", long: true },
      { key: "payment.usd", label: "USD account details", long: true },
    ],
  },
  {
    title: "Social media",
    keys: [
      { key: "social.facebook", label: "Facebook URL" },
      { key: "social.instagram", label: "Instagram URL" },
      { key: "social.youtube", label: "YouTube URL" },
    ],
  },
];

export default function SettingsTab() {
  const { token } = useStaff();
  const [content, setContent] = useState<Record<string, string>>({});
  const [areas, setAreas] = useState<{ name: string; fee: string }[]>([]);
  const [newArea, setNewArea] = useState({ name: "", fee: "" });
  const [busy, setBusy] = useState(false);
  const [faqs, setFaqs] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ content: Record<string, string>; areas: { id: string; name: string; fee: number }[] }>("/api/admin/settings", { token });
      setContent(res.content);
      setAreas(res.areas.map((a) => ({ name: a.name, fee: String(a.fee) })));
      const f = res.content["faqs"];
      try {
        const parsed = JSON.parse(f ?? "[]") as { q: string; a: string }[];
        setFaqs(parsed.map((x) => `Q: ${x.q}\nA: ${x.a}`).join("\n\n"));
      } catch {
        setFaqs(f ?? "");
      }
    } catch (e) {
      toast({ title: "Could not load settings", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (key: string, value: string) => setContent((c) => ({ ...c, [key]: value }));

  const faqsToJson = (): string => {
    try {
      const blocks = faqs.split("\n\n").filter((b) => b.trim());
      const arr = blocks.map((b) => {
        const q = b.match(/^Q:\s*([\s\S]*?)(?=\nA:|$)/m)?.[1]?.trim() ?? "";
        const a = b.match(/^A:\s*([\s\S]*)$/m)?.[1]?.trim() ?? "";
        return { q, a };
      }).filter((x) => x.q && x.a);
      return JSON.stringify(arr);
    } catch {
      return JSON.stringify([]);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload: Record<string, string> = { ...content };
      payload["faqs"] = faqsToJson();
      await api("/api/admin/settings", {
        method: "POST",
        token,
        body: {
          content: payload,
          areas: areas.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), fee: Number(a.fee) || 0 })),
        },
      });
      toast({ title: "Saved", description: "The website now shows your changes. Everything is logged." });
      void load();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeArea = async (name: string) => {
    try {
      await api(`/api/admin/settings?area=${encodeURIComponent(name)}`, { method: "DELETE", token });
      setAreas((a) => a.filter((x) => x.name !== name));
      toast({ title: "Area removed" });
    } catch (e) {
      toast({ title: "Could not remove", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title} className="rounded-xl border bg-white p-4">
          <h2 className="font-bold">{g.title}</h2>
          <div className="mt-3 grid gap-3">
            {g.keys.map((k) => (
              <div key={k.key}>
                <Label htmlFor={`set-${k.key}`}>{k.label}</Label>
                {k.long ? (
                  <Textarea id={`set-${k.key}`} rows={4} className="mt-1" value={content[k.key] ?? ""} onChange={(e) => set(k.key, e.target.value)} />
                ) : (
                  <Input id={`set-${k.key}`} className="mt-1" value={content[k.key] ?? ""} onChange={(e) => set(k.key, e.target.value)} />
                )}
                <p className="mt-0.5 text-[10px] text-muted-foreground">{k.key}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">FAQs</h2>
        <p className="mt-1 text-xs text-muted-foreground">One FAQ per block: a line starting with “Q:” then a line starting with “A:”. Separate FAQs with a blank line.</p>
        <Textarea rows={10} className="mt-2 font-mono text-xs" value={faqs} onChange={(e) => setFaqs(e.target.value)} />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Delivery areas &amp; fees</h2>
        <div className="mt-3 space-y-2">
          {areas.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={a.name} onChange={(e) => setAreas((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Area name" className="flex-1" />
              <Input value={a.fee} onChange={(e) => setAreas((arr) => arr.map((x, j) => (j === i ? { ...x, fee: e.target.value } : x)))} inputMode="numeric" aria-label="Fee (GHS)" className="w-28" />
              <button onClick={() => removeArea(a.name)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="New area name" value={newArea.name} onChange={(e) => setNewArea((n) => ({ ...n, name: e.target.value }))} className="flex-1" />
          <Input placeholder="Fee" inputMode="numeric" value={newArea.fee} onChange={(e) => setNewArea((n) => ({ ...n, fee: e.target.value }))} className="w-28" />
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (!newArea.name.trim()) return;
              setAreas((a) => [...a, { name: newArea.name.trim(), fee: newArea.fee || "0" }]);
              setNewArea({ name: "", fee: "" });
            }}
          >
            Add
          </Button>
        </div>
      </div>

      <Button onClick={save} disabled={busy} size="lg" className="w-full rounded-full">{busy ? "Saving…" : "Save all content & areas"}</Button>
    </div>
  );
}
