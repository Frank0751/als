"use client";

// Partner and Invest: the case for ALS, partnership types, profile PDF, enquiry form

import { useState } from "react";
import { useCatalog } from "../catalog-context";
import { SectionTitle } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { waLink } from "@/lib/als/format";
import { Spinner } from "../ui-bits";

const TYPES = [
  ["Investors", "Capital for hatchery expansion, more cages on the Volta and cold-chain handling. Demand for fingerlings already exceeds supply, growth converts directly into volume."],
  ["Development partners", "Co-funding for the free training programme and its target of 1,000 people trained in four years, with a focus on women and persons with disabilities."],
  ["NGOs", "Delivery partners for outreach, training cohorts and follow-up with communities in the Eastern Region and along the Volta."],
  ["Buyers", "Wholesale buyers of fingerlings and market-size tilapia, with scheduled orders matched to production cycles."],
  ["Research institutions", "Field sites for aquaculture research, student placements and joint trials on feed, breeding and cage systems."],
];

export default function PartnerView() {
  const { content } = useCatalog();
  const wa = content("contact.whatsapp_1");
  const email = content("contact.email");
  const [form, setForm] = useState({ name: "", org: "", email: "", phone: "", type: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          subject: `Partnership enquiry: ${form.type || "General"}`,
          message: `Organisation: ${form.org || "not given"}\nPartnership type: ${form.type || "not given"}\n\n${form.message}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The enquiry could not be sent.");
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "The enquiry could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <section className="relative">
        <img src="/images/harvest.png" alt="Tilapia harvested from cages on the Volta River" className="h-56 w-full object-cover sm:h-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 to-teal-950/20" />
        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-end px-4 pb-5 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-4xl">Partner with Aquatic Link Solutions</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <SectionTitle title="The case for ALS" />
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Ghana eats far more fish than it farms, and tilapia is the country&apos;s most farmed fish. The binding constraint on that industry is fingerling supply: good-quality, reliably available fingerlings are scarce, and the national aquaculture plans name that shortage as a key bottleneck.
          </p>
          <p>
            Aquatic Link Solutions sits directly at that bottleneck. The hatchery at Akuse produces the fingerlings farmers are waiting for, demand already exceeds supply, and every expansion of the hatchery converts into volume. The cage grow-out on the Volta River proves the company&apos;s own methods and adds a second revenue line: market-size tilapia.
          </p>
          <p>
            The free training programme builds the customer base and the workforce around the farm, with a committed target of 1,000 people trained in four years. That combination, production the market is short of, plus a growing trained community, is what ALS offers its partners.
          </p>
        </div>

        <SectionTitle title="Ways to partner with ALS" />
        <ul className="space-y-4">
          {TYPES.map(([t, d]) => (
            <li key={t} className="rounded border bg-[#FDFCF8] p-4">
              <h3 className="text-left text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded border bg-[#FDFCF8] p-5">
          <h3 className="text-left text-base font-semibold">Company profile</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A company profile with operational details, photos and references is available to serious partners.
            [TO CONFIRM: company profile PDF, to be supplied by ALS and linked here.]
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            In the meantime, request it directly on {email ? <a href={`mailto:${email}`} className="font-medium text-teal-800 underline underline-offset-2">{email}</a> : "our email"} or on WhatsApp{wa ? <> at <a href={waLink(wa, "Hello ALS, please send me the company profile.")} target="_blank" rel="noreferrer" className="font-medium text-teal-800 underline underline-offset-2">{wa}</a></> : null}.
          </p>
        </div>

        <SectionTitle title="Send a partnership enquiry" />
        {done ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-6 text-center">
            <p className="font-semibold text-emerald-800">Enquiry received</p>
            <p className="mt-1 text-sm text-emerald-900">
              Your message is saved with ALS and will be reviewed. We reply within one working day by email or phone.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 rounded border bg-[#FDFCF8] p-5" noValidate={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Your name</Label>
                <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-org">Organisation</Label>
                <Input id="p-org" value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} placeholder="Company or institution" autoComplete="organization" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@organisation.org" autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Phone or WhatsApp</Label>
                <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 ..." autoComplete="tel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-type">Partnership type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} required>
                <SelectTrigger id="p-type" className="w-full"><SelectValue placeholder="Choose the closest fit" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(([t]) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  <SelectItem value="General">Something else</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-msg">Message</Label>
              <Textarea id="p-msg" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell ALS what you have in mind: capital, co-funding, buying, research or outreach." />
            </div>
            {err && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <Button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-amber-500 font-semibold text-stone-900 hover:bg-amber-600 sm:w-auto sm:px-6">
              {busy ? <><Spinner /> Sending</> : "Send enquiry"}
            </Button>
            <p className="text-xs text-muted-foreground">Your details are used only to reply to this enquiry. See the privacy policy in the footer.</p>
          </form>
        )}
      </div>
    </div>
  );
}
