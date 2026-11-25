"use client";

// Checkout, contact, delivery or farm pickup, ALS-open date, review, then "Send order on WhatsApp"

import { useMemo, useState } from "react";
import { useCart, useCheckout, useCustomer, navigate, itemsToOrderItems } from "@/lib/als/store";
import { useCatalog } from "../catalog-context";
import { ghs, fmtDate } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Store, Truck, CalendarDays, Send } from "lucide-react";

export default function CheckoutView() {
  const cart = useCart();
  const { draft, set, reset } = useCheckout();
  const customer = useCustomer((s) => s.customer);
  const { catalog } = useCatalog();
  const [busy, setBusy] = useState(false);

  const items = cart.items;
  const subtotal = cart.subtotal();
  const area = catalog?.deliveryAreas.find((a) => a.name === draft.areaName);
  const areaFee = draft.fulfilment === "DELIVERY" ? area?.fee ?? 0 : 0;
  const total = Math.round((subtotal + areaFee) * 100) / 100;

  // prefill once from customer session
  useMemo(() => {
    if (customer && !draft.name) {
      set({ name: customer.name, phone: customer.phone, email: customer.email ?? "", city: customer.city ?? "" });
    }
  }, [customer, draft.name, set]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Button className="mt-4 rounded-full" onClick={() => navigate("fingerlings")}>Browse fingerlings</Button>
      </div>
    );
  }

  const pick = (fulfilment: "PICKUP" | "DELIVERY") => {
    set({ fulfilment, areaName: fulfilment === "PICKUP" ? "" : draft.areaName || catalog?.deliveryAreas[0]?.name || "" });
  };

  const valid = draft.name.trim().length > 1 && draft.phone.replace(/[^0-9]/g, "").length >= 9 && (draft.fulfilment === "PICKUP" || draft.areaName) && draft.deliveryDate;

  const sendOrder = async () => {
    if (!valid) {
      toast({ title: "Missing details", description: "Fill in your name, phone and collection or delivery date.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ orderNumber: string }>("/api/orders", {
        method: "POST",
        body: {
          name: draft.name,
          phone: draft.phone,
          email: draft.email,
          city: draft.city,
          fulfilment: draft.fulfilment,
          areaName: draft.fulfilment === "DELIVERY" ? draft.areaName : undefined,
          deliveryDate: draft.deliveryDate,
          items: itemsToOrderItems(items),
          notes: draft.notes,
        },
      });
      reset();
      cart.clear();
      navigate("confirm", { order: res.orderNumber, phone: draft.phone.trim() });
    } catch (e) {
      toast({ title: "Could not place order", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">One order, one WhatsApp message, every detail filled in for ALS.</p>

      {/* 1. contact */}
      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="font-bold">1. Your details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="c-name">Full name</Label><Input id="c-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Akosua Mensah" /></div>
            <div><Label htmlFor="c-phone">Phone / WhatsApp</Label><Input id="c-phone" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="e.g. 020 123 4567" /></div>
            <div><Label htmlFor="c-email">Email (optional, order updates are emailed here)</Label><Input id="c-email" type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} /></div>
            <div><Label htmlFor="c-city">Town / city (optional)</Label><Input id="c-city" value={draft.city} onChange={(e) => set({ city: e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* 2. fulfilment */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-bold">2. Collection or delivery</h2>
          <RadioGroup value={draft.fulfilment} onValueChange={(v) => pick(v as "PICKUP" | "DELIVERY")} className="mt-3 grid gap-3 sm:grid-cols-2">
            <Label
              htmlFor="pick-pickup"
              className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", draft.fulfilment === "PICKUP" && "border-teal-600 bg-teal-50")}
            >
              <RadioGroupItem value="PICKUP" id="pick-pickup" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold"><Store className="h-4 w-4 text-teal-700" aria-hidden="true" /> Farm pickup</span>
                <span className="mt-1 block text-xs text-muted-foreground">Collect at the ALS farm gate in Akuse, no delivery fee.</span>
              </span>
            </Label>
            <Label
              htmlFor="pick-delivery"
              className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", draft.fulfilment === "DELIVERY" && "border-teal-600 bg-teal-50")}
            >
              <RadioGroupItem value="DELIVERY" id="pick-delivery" />
              <span>
                <span className="flex items-center gap-1.5 font-semibold"><Truck className="h-4 w-4 text-teal-700" aria-hidden="true" /> Delivery</span>
                <span className="mt-1 block text-xs text-muted-foreground">Fees by area, set by ALS. Fingerlings travel in oxygen-bagged lots.</span>
              </span>
            </Label>
          </RadioGroup>

          {draft.fulfilment === "DELIVERY" && (
            <div className="mt-4">
              <Label htmlFor="c-area">Delivery area</Label>
              <Select value={draft.areaName} onValueChange={(v) => set({ areaName: v })}>
                <SelectTrigger id="c-area" className="mt-1"><SelectValue placeholder="Choose your area" /></SelectTrigger>
                <SelectContent>
                  {catalog?.deliveryAreas.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.name}, {ghs(a.fee)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-4">
            <Label htmlFor="c-date">Collection / delivery date, only dates ALS has opened</Label>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Open collection dates">
              {catalog?.collectionDates.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => set({ deliveryDate: d.date })}
                  aria-pressed={draft.deliveryDate === d.date}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-sm font-medium",
                    draft.deliveryDate === d.date ? "border-teal-700 bg-teal-700 text-white" : "bg-white text-stone-700 hover:border-teal-600"
                  )}
                >
                  <CalendarDays className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
                  {fmtDate(d.date)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Live fish are never sold before they are ready, that is why ALS opens dates in advance.</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. review */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-bold">3. Review your order</h2>
          <div className="mt-3 divide-y">
            {items.map((i) => (
              <div key={`${i.refId}-${i.sessionId ?? ""}`} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.variant}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{ghs(i.lineTotal)}</p>
                  <p className="text-xs text-muted-foreground">{i.qty.toLocaleString()} × {ghs(i.unitPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{ghs(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{draft.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery, ${draft.areaName || "choose area"}`}</span><span>{areaFee ? ghs(areaFee) : "GHS 0.00"}</span></div>
            <div className="flex justify-between text-lg font-extrabold"><span>Total</span><span className="text-teal-800">{ghs(total)}</span></div>
          </div>
          <div className="mt-4">
            <Label htmlFor="c-notes">Notes for ALS (optional)</Label>
            <Textarea id="c-notes" rows={2} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. Deliver to the junction near the school, call when you arrive" />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-2xl border-2 border-teal-600 bg-teal-50 p-5">
        <p className="flex items-center gap-2 font-bold"><Send className="h-5 w-5 text-teal-700" aria-hidden="true" /> Send this order to ALS on WhatsApp</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tapping the button saves your order, then opens WhatsApp with the full order typed in, order number, items, sizes, quantities, prices, total, date, and your name and phone. One tap and ALS has it.
        </p>
        <Button size="lg" className="mt-4 w-full rounded-full" disabled={!valid || busy} onClick={sendOrder}>
          {busy ? "Placing your order…" : `Send order on WhatsApp, ${ghs(total)}`}
        </Button>
        {!valid && <p className="mt-2 text-xs text-red-600">Fill in your name, phone, area (if delivery) and an open date above.</p>}
      </div>
    </div>
  );
}
