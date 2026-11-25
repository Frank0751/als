"use client";

// Fingerlings shop, sizes, quantity pricing, live stock, ALS-open dates, quote requests

import { useMemo, useState } from "react";
import { useCatalog } from "../catalog-context";
import { useCart, navigate } from "@/lib/als/store";
import type { ProductDTO } from "@/lib/als/types";
import { ProductImage, SectionTitle, StockPill } from "../ui-bits";
import { fmtDate, ghs, unitPriceFor } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { throttle, api } from "@/lib/als/api";
import { CalendarDays, Fish, Info, FileText } from "lucide-react";

function TierTable({ tiers, base }: { tiers: ProductDTO["priceTiers"]; base: number }) {
  if (!tiers || tiers.length === 0) return null;
  const rows = [{ minQty: 1, price: base, label: "Any quantity" }, ...[...tiers].sort((a, b) => a.minQty - b.minQty)];
  return (
    <table className="w-full border-separate border-spacing-y-1 text-sm">
      <tbody>
        {rows.map((t, i) => (
          <tr key={t.minQty} className={i === rows.length - 1 ? "text-emerald-800" : ""}>
            <td className="rounded-l-md bg-teal-50 px-3 py-1.5 font-medium">{t.label}</td>
            <td className="rounded-r-md bg-teal-50 px-3 py-1.5 text-right font-bold">{ghs(t.price)} /fingerling</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FingerlingCard({ p, nextDate }: { p: ProductDTO; nextDate?: string }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1000);
  const [open, setOpen] = useState(false);

  const unitPrice = unitPriceFor(p.priceTiers, p.price, qty);
  const total = Math.round(qty * unitPrice * 100) / 100;
  const inCart = useCart((s) => s.items.some((i) => i.refId === p.id));

  const addNow = () => {
    if (qty <= 0) return;
    if (qty > p.stock) {
      toast({ title: "Not enough stock", description: `We currently hold ${p.stock.toLocaleString()} fingerlings of this size. Try a smaller quantity or request a quote.`, variant: "destructive" });
      return;
    }
    add({
      kind: "FINGERLING",
      refId: p.id,
      name: p.name,
      variant: `${qty.toLocaleString()} pcs @ GHS ${unitPrice.toFixed(2)}`,
      qty,
      unit: p.unit,
      unitPrice,
      maxQty: p.stock,
      date: nextDate ?? null,
    });
    toast({ title: "Added to cart", description: `${qty.toLocaleString()} × ${p.name}` });
  };

  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative">
        <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-48 w-full" />
        <span className="absolute left-3 top-3"><Badge className="bg-teal-700 text-white hover:bg-teal-700">{p.category}</Badge></span>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug">{p.name}</h3>
          <StockPill stock={p.stock} unit={p.unit} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.spec}</p>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity pricing</p>
          <TierTable tiers={p.priceTiers} base={p.price} />
        </div>

        <div className="mt-4 rounded-xl border bg-stone-50 p-3">
          <Label htmlFor={`qty-${p.id}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How many fingerlings?</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Input
              id={`qty-${p.id}`}
              type="number"
              min={1}
              step={100}
              value={qty}
              onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value))))}
              className="w-32"
            />
            {[500, 1000, 5000, 10000].map((q) => (
              <Button key={q} type="button" size="sm" variant="outline" className="rounded-full" onClick={() => setQty(q)}>
                {q.toLocaleString()}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{qty.toLocaleString()} × {ghs(unitPrice)}</span>
            <span className="text-lg font-extrabold text-teal-800">{ghs(total)}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="flex-1 rounded-full" onClick={addNow} disabled={p.stock <= 0}>
            {p.stock <= 0 ? "Out of stock" : "Add to cart"}
          </Button>
          {p.stock > 0 && p.stock < qty && (
            <Button variant="outline" className="rounded-full" onClick={addNow}>Add what&rsquo;s in stock</Button>
          )}
        </div>
        {inCart && <p className="mt-2 text-center text-xs font-medium text-teal-700">In your cart, review at checkout</p>}
      </CardContent>
    </Card>
  );
}

function QuoteDialog() {
  const [form, setForm] = useState({ name: "", org: "", phone: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!throttle("quote")) return;
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/api/quote", { method: "POST", body: { ...form, website: "" } });
      toast({ title: "Quote request sent", description: res.message });
      setOpen(false);
      setForm({ name: "", org: "", phone: "", email: "", message: "" });
    } catch (e) {
      toast({ title: "Could not send", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full"><FileText className="h-4 w-4" aria-hidden="true" /> Request a quote for a very large order</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a quote</DialogTitle>
          <DialogDescription>For very large farm orders, stocking a new pond block or cage battery. ALS replies within one working day.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label htmlFor="q-name">Your name</Label><Input id="q-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label htmlFor="q-org">Farm / organisation (optional)</Label><Input id="q-org" value={form.org} onChange={(e) => set("org", e.target.value)} /></div>
          <div><Label htmlFor="q-phone">Phone / WhatsApp</Label><Input id="q-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><Label htmlFor="q-email">Email (optional)</Label><Input id="q-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><Label htmlFor="q-msg">What do you need?</Label><Textarea id="q-msg" rows={4} placeholder="e.g. 40,000 fingerlings of 10-15 g for cages near Atimpoku, delivered in November" value={form.message} onChange={(e) => set("message", e.target.value)} /></div>
          <input type="text" name="website" value="" readOnly hidden aria-hidden="true" tabIndex={-1} autoComplete="off" />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full sm:w-auto">{busy ? "Sending…" : "Send quote request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FingerlingsView() {
  const { catalog } = useCatalog();
  if (!catalog) return null;
  const fingerlings = catalog.products.filter((p) => p.kind === "FINGERLING");
  const nextDates = catalog.collectionDates.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="From the ALS hatchery · Akuse"
        title="Tilapia fingerlings"
        sub="Tilapia fingerlings are young fish that have developed beyond the fry stage, ready to stock into fish ponds and cage farming systems, and raised by farmers until they reach market size. All sizes are graded at our hatchery and sold in oxygen-bagged lots."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">Collection &amp; delivery dates ALS has opened</p>
            <p className="mt-1 text-muted-foreground">
              Live fish are never sold before they are ready. You will pick one of these dates at checkout:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {nextDates.map((d) => (
                <Badge key={d.id} variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">
                  {fmtDate(d.date)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold">Every order travels with our care guide</p>
            <p className="mt-1 text-muted-foreground">
              A short, plain-language guide for the first 7 days after stocking, to cut early losses and repeat questions. Ask us anything on WhatsApp before or after you buy.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fingerlings.map((p) => (
          <FingerlingCard key={p.id} p={p} nextDate={catalog.collectionDates[0]?.date} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-teal-50 p-6 sm:flex-row">
        <div className="flex items-start gap-3">
          <Fish className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden="true" />
          <div>
            <p className="font-bold">Stocking a big pond block or new cages?</p>
            <p className="text-sm text-muted-foreground">For very large orders ALS quotes a batch price and reserves fish for your date.</p>
          </div>
        </div>
        <QuoteDialog />
      </div>
    </div>
  );
}
