"use client";

// Apply to Train: the free training application form (CLAUDE.md section 5)

import { useState } from "react";
import { useCatalog } from "../catalog-context";
import { SectionTitle, Spinner } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { waLink } from "@/lib/als/format";

const REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra",
  "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West",
  "Volta", "Western", "Western North", "Outside Ghana",
];
const AGES = ["Under 18", "18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 or older"];
const GENDERS = ["Woman", "Man", "Prefer to describe myself", "Prefer not to say"];
const EXPERIENCE = ["None yet", "Beginner", "Practising farmer"];
const FORMATS = ["On the farm", "Online videos", "Either works for me"];
const SOURCES = [
  "Facebook or Instagram", "WhatsApp forward", "A friend or family member",
  "Radio", "Found ALS on Google", "Saw the farm in person", "Other",
];

type Saved = { ref: string; fullName: string; format: string };

export default function ApplyView() {
  const { content } = useCatalog();
  const wa = content("contact.whatsapp_1");
  const [form, setForm] = useState({
    fullName: "", phone: "", email: "", gender: "", ageRange: "", region: "", town: "",
    experience: "", format: "", source: "", disability: "", consent: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.consent) {
      setErr("Please tick the consent box so ALS may store and review your application.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The application could not be sent.");
      setSaved({ ref: data.ref, fullName: form.fullName, format: form.format });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "The application could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    const waText = `Hello ALS, I have applied to train with the platform.\nApplication reference: ${saved.ref}\nName: ${saved.fullName}\nPreferred format: ${saved.format}`;
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <p className="font-serif text-5xl font-bold text-teal-800" aria-hidden="true">✓</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Application received</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Thank you, {saved.fullName.split(" ")[0]}. Training with ALS is free. Your application now carries reference{" "}
          <span className="tnum font-bold text-foreground">{saved.ref}</span>. ALS reviews every application and replies by phone or WhatsApp with the next step.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {wa && (
            <Button
              onClick={() => window.open(waLink(wa, waText), "_blank")}
              className="min-h-11 rounded wa-green px-5 font-semibold text-white hover:bg-[#1fbe5a]"
            >
              Confirm on WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={() => { setSaved(null); setForm({ fullName: "", phone: "", email: "", gender: "", ageRange: "", region: "", town: "", experience: "", format: "", source: "", disability: "", consent: false }); }} className="min-h-11 rounded border-teal-800 px-5 text-teal-800 hover:bg-teal-50">
            Apply for someone else
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Keep your reference {saved.ref}. Quote it whenever you contact ALS about your application.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold sm:text-4xl">Apply to train</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Training with ALS is free of charge. Learn on the farm at Akuse or at home through structured online video modules. Women and persons with disabilities are prioritised, and everyone is welcome to apply.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5 rounded border bg-[#FDFCF8] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-name">Full name</Label>
            <Input id="a-name" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="As on your phone contact" autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-phone">Phone (WhatsApp)</Label>
            <Input id="a-phone" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+233 ..." autoComplete="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-email">Email (optional)</Label>
            <Input id="a-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-gender">Gender</Label>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)} required>
              <SelectTrigger id="a-gender" className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-age">Age range</Label>
            <Select value={form.ageRange} onValueChange={(v) => set("ageRange", v)} required>
              <SelectTrigger id="a-age" className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{AGES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-region">Region</Label>
            <Select value={form.region} onValueChange={(v) => set("region", v)} required>
              <SelectTrigger id="a-region" className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-town">Town or community</Label>
            <Input id="a-town" required value={form.town} onChange={(e) => set("town", e.target.value)} placeholder="e.g. Somanya" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-exp">Fish farming experience</Label>
            <Select value={form.experience} onValueChange={(v) => set("experience", v)} required>
              <SelectTrigger id="a-exp" className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{EXPERIENCE.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-format">Preferred format</Label>
            <Select value={form.format} onValueChange={(v) => set("format", v)} required>
              <SelectTrigger id="a-format" className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-src">How did you hear about ALS?</Label>
            <Select value={form.source} onValueChange={(v) => set("source", v)}>
              <SelectTrigger id="a-src" className="w-full"><SelectValue placeholder="Choose (optional)" /></SelectTrigger>
              <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-dis">Disability, health or access needs (optional)</Label>
          <Textarea id="a-dis" rows={2} value={form.disability} onChange={(e) => set("disability", e.target.value)} placeholder="Anything we should plan for, for example captions, accessible seating or materials in large print." />
          <p className="text-xs leading-relaxed text-muted-foreground">
            This question is voluntary. ALS asks so it can plan access needs for training. Your answer is seen only by the ALS owner and training team, it never appears on public pages, and it does not affect your chances of being accepted.
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox id="a-consent" checked={form.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5" />
          <Label htmlFor="a-consent" className="text-sm font-normal leading-relaxed">
            I agree that ALS may store and use these details to review my application and contact me about training. Read the privacy policy in the footer.
          </Label>
        </div>

        {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

        <Button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-amber-500 font-semibold text-stone-900 hover:bg-amber-600 sm:w-auto sm:px-6">
          {busy ? <><Spinner /> Sending</> : "Submit application"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Questions first? WhatsApp ALS{wa ? <> at <a href={waLink(wa, "Hello ALS, I have a question about the free training.")} target="_blank" rel="noreferrer" className="font-medium text-teal-800 underline underline-offset-2">{wa}</a></> : null}.
      </p>
    </div>
  );
}
