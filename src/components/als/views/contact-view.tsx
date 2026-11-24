"use client";

// Contact — secure form with spam protection + WhatsApp + location

import { useState } from "react";
import { useCatalog } from "../catalog-context";
import { SectionTitle } from "../ui-bits";
import { ghs, waLink } from "@/lib/als/format";
import { api, throttle } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Clock3, MapPin, MessageCircle, Send } from "lucide-react";

export default function ContactView() {
  const { content } = useCatalog();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!throttle("contact")) return;
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/api/contact", { method: "POST", body: { ...form, website: "" } });
      toast({ title: "Message sent", description: res.message });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (e) {
      toast({ title: "Could not send", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const wa1 = content("contact.whatsapp_1");
  const wa2 = content("contact.whatsapp_2");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="Contact ALS"
        title="Talk to the farm, not a call centre"
        sub="WhatsApp is fastest. Or send the form below — ALS replies within one working day."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {wa1 && (
            <a href={waLink(wa1, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className="block rounded-xl border bg-white p-4 transition-colors hover:border-teal-600">
              <p className="flex items-center gap-2 font-bold"><MessageCircle className="h-4 w-4 text-teal-700" aria-hidden="true" /> WhatsApp line 1</p>
              <p className="mt-1 text-sm text-muted-foreground">{wa1} — orders and general questions</p>
            </a>
          )}
          {wa2 && (
            <a href={waLink(wa2, "Hello Aquatic Link Solutions!")} target="_blank" rel="noreferrer" className="block rounded-xl border bg-white p-4 transition-colors hover:border-teal-600">
              <p className="flex items-center gap-2 font-bold"><MessageCircle className="h-4 w-4 text-teal-700" aria-hidden="true" /> WhatsApp line 2</p>
              <p className="mt-1 text-sm text-muted-foreground">{wa2} — training and farm visits</p>
            </a>
          )}
          <div className="rounded-xl border bg-white p-4">
            <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" /> Visit the farm</p>
            <p className="mt-1 text-sm text-muted-foreground">{content("contact.location")}</p>
            <p className="text-sm text-muted-foreground">Email: {content("contact.email")}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="flex items-center gap-2 font-bold"><Clock3 className="h-4 w-4 text-teal-700" aria-hidden="true" /> Opening hours</p>
            <p className="mt-1 text-sm text-muted-foreground">{content("contact.hours")}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="font-bold">Buyers abroad</p>
            <p className="mt-1 text-sm text-muted-foreground">ALS serves buyers beyond Ghana, with contacts in Norway and partners abroad. Write to us and we will arrange it.</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold"><Send className="h-4 w-4 text-teal-700" aria-hidden="true" /> Send a message</h2>
          <div className="mt-4 grid gap-3">
            <div><Label htmlFor="ct-name">Your name</Label><Input id="ct-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label htmlFor="ct-email">Email</Label><Input id="ct-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><Label htmlFor="ct-phone">Phone</Label><Input id="ct-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            </div>
            <div>
              <Label htmlFor="ct-subject">Subject</Label>
              <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                <SelectTrigger id="ct-subject" className="mt-1"><SelectValue placeholder="What is it about?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fingerlings order">Fingerlings order</SelectItem>
                  <SelectItem value="Equipment question">Equipment question</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Farm visit">Farm visit</SelectItem>
                  <SelectItem value="Quote for large order">Quote for a large order</SelectItem>
                  <SelectItem value="Something else">Something else</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="ct-msg">Message</Label><Textarea id="ct-msg" rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Write your message here…" /></div>
            <input type="text" name="website" readOnly hidden aria-hidden="true" tabIndex={-1} autoComplete="off" />
            <Button onClick={submit} disabled={busy} className="rounded-full">{busy ? "Sending…" : "Send message"}</Button>
            <p className="text-xs text-muted-foreground">This form is protected against spam and abuse.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
