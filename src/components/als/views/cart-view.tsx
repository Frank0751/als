"use client";

// Cart, fingerlings, marketplace items and training bookings in one basket

import { useCart, navigate, useCheckout, useCustomer } from "@/lib/als/store";
import { useCatalog } from "../catalog-context";
import { ProductImage } from "../ui-bits";
import { ghs } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Trash2, Fish, GraduationCap } from "lucide-react";

export default function CartView() {
  const { items, setQty, remove, subtotal } = useCart();
  const { draft } = useCheckout();
  const customer = useCustomer((s) => s.customer);
  const { catalog } = useCatalog();
  const imageFor = (refId: string) => catalog?.products.find((p) => p.id === refId)?.imageUrl ?? null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-teal-800" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">Your request list is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add fingerlings, equipment or training, then send everything to ALS on WhatsApp. No account needed.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button className="rounded" onClick={() => navigate("fingerlings")}>Fingerlings</Button>
          <Button variant="outline" className="rounded" onClick={() => navigate("market")}>Marketplace</Button>
          <Button variant="outline" className="rounded" onClick={() => navigate("training")}>Training</Button>
        </div>
      </div>
    );
  }

  const count = items.reduce((s, i) => s + i.qty, 0);
  const hasFingerlings = items.some((i) => i.kind === "FINGERLING");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold">Your request list</h1>
      <p className="mt-1 text-sm text-muted-foreground">{count.toLocaleString()} {count === 1 ? "item" : "items"}. Prices are calculated by the platform, so every request carries the correct amount.</p>

      <div className="mt-6 space-y-3">
        {items.map((i) => (
          <Card key={`${i.refId}-${i.sessionId ?? ""}`} className="p-3">
            <CardContent className="flex items-center gap-3 p-1">
              <ProductImage src={imageFor(i.refId)} alt={i.name} kind={i.kind} className="h-16 w-16 shrink-0 rounded border" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                  {i.kind === "TRAINING" && <GraduationCap className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />}
                  {i.kind === "FINGERLING" && <Fish className="h-3.5 w-3.5 shrink-0 text-teal-700" aria-hidden="true" />}
                  <span className="truncate">{i.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {i.variant}
                  {i.kind === "TRAINING" ? " · receipt doubles as admission slip" : ""}
                </p>
                <p className="mt-1 text-sm font-extrabold text-teal-800">{ghs(i.lineTotal)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {i.kind === "TRAINING" ? (
                  <span className="text-sm font-medium">{i.qty} seat{i.qty === 1 ? "" : "s"}</span>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    max={i.maxQty ?? 999999}
                    value={i.qty}
                    onChange={(e) => setQty(i.refId, i.sessionId, Math.max(0, Math.floor(Number(e.target.value))))}
                    className="h-9 w-24"
                    aria-label={`Quantity for ${i.name}`}
                  />
                )}
                <button
                  onClick={() => remove(i.refId, i.sessionId)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                  aria-label={`Remove ${i.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-6" />
      <div className="flex items-center justify-between text-lg font-bold">
        <span>Subtotal</span>
        <span>{ghs(subtotal())}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        On the next step you choose delivery or pickup and the date. {hasFingerlings && "Live fish are handed over only on dates ALS has opened."}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1 rounded" onClick={() => navigate("checkout")}>
          Add your details and send
        </Button>
        <Button size="lg" variant="outline" className="rounded" onClick={() => navigate("fingerlings")}>Keep shopping</Button>
      </div>
      {customer && (
        <p className="mt-4 text-xs text-teal-700">Signed in as {customer.name}, your details will be filled in on the next step.</p>
      )}
      {draft.fulfilment === "DELIVERY" && <span className="hidden" />}
    </div>
  );
}
