"use client";

// Track, follow each stage by order number and phone number

import { useCallback, useEffect, useState } from "react";
import type { OrderDTO } from "@/lib/als/types";
import { navigate, useCustomer } from "@/lib/als/store";
import { StatusBadge } from "../ui-bits";
import { fmtDate, fmtDateTime, ghs, statusLabel, ORDER_STAGES } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ClipboardList, Check, Truck, Store, ReceiptText, PackageOpen } from "lucide-react";

const STAGE_META: Record<string, { label: string }> = {
  RECEIVED: { label: "Request received" },
  CONTACTED: { label: "Contacted by ALS" },
  CONFIRMED: { label: "Confirmed" },
  PAYMENT_CONFIRMED: { label: "Confirmed" },
  PREPARING: { label: "Being prepared" },
  READY_OUT: { label: "Ready for pickup" },
  OUT_FOR_DELIVERY: { label: "Out for delivery" },
  COMPLETED: { label: "Completed" },
};

function Timeline({ order }: { order: OrderDTO }) {
  // visible stages depend on fulfilment
  const stages = ORDER_STAGES.filter((s) => (order.fulfilment === "PICKUP" ? s !== "OUT_FOR_DELIVERY" : s !== "READY_OUT") || s === "RECEIVED" || s === "PAYMENT_CONFIRMED" || s === "PREPARING" || s === "COMPLETED");
  const unique = ["RECEIVED", "PAYMENT_CONFIRMED", "PREPARING", order.fulfilment === "PICKUP" ? "READY_OUT" : "OUT_FOR_DELIVERY", "COMPLETED"];
  const stageList = [...new Set([...stages, ...unique])].filter((v, i, a) => a.indexOf(v) === i);
  const currentIdx = order.status === "CANCELLED" ? -1 : stageList.indexOf(order.status);
  const eventsByStatus = new Map(order.events.map((e) => [e.status, e]));

  return (
    <div>
      {order.status === "CANCELLED" ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          This order was cancelled. {order.notes ? `Note from ALS: ${order.notes}` : ""}
        </div>
      ) : (
        <ol className="relative space-y-0 border-l-2 border-dashed border-teal-200 pl-6">
          {stageList.map((s, i) => {
            const ev = eventsByStatus.get(s);
            const done = i <= currentIdx;
            return (
              <li key={s} className="relative pb-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                    done ? "border-teal-600 bg-teal-600 text-white" : "border-stone-300 bg-white text-stone-300"
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <p className={cn("text-sm font-bold", done ? "text-foreground" : "text-muted-foreground")}>
                  {STAGE_META[s]?.label ?? statusLabel(s)}
                </p>
                {ev && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtDateTime(ev.createdAt)}{ev.actor ? ` · by ${ev.actor}` : ""}
                  </p>
                )}
                {ev?.note && <p className="mt-0.5 text-xs text-muted-foreground">{ev.note}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function TrackView({ params }: { params: Record<string, string> }) {
  const customer = useCustomer((s) => s.customer);
  const [number, setNumber] = useState(params.order ?? "");
  const [phone, setPhone] = useState(params.phone ?? customer?.phone ?? "");
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const track = useCallback(async (num: string, ph: string) => {
    if (!num || !ph) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ order: OrderDTO }>(`/api/orders?number=${encodeURIComponent(num)}&phone=${encodeURIComponent(ph)}`);
      setOrder(res.order);
      window.history.replaceState(null, "", `#/track?order=${encodeURIComponent(num)}&phone=${encodeURIComponent(ph)}`);
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : "Could not find that order.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (params.order && (params.phone || customer?.phone)) void track(params.order, params.phone ?? customer?.phone ?? "");
     
  }, [params.order]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold">Track your order</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every ALS order has a number. Enter it with your phone number to see exactly where things stand, and download any past receipt.</p>

      {!order && (
        <Card className="mt-6">
          <CardContent className="p-5">
            <div className="grid gap-3">
              <div><Label htmlFor="t-num">Order number</Label><Input id="t-num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. ALS-2026-0007" /></div>
              <div><Label htmlFor="t-phone">Your phone number</Label><Input id="t-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="The number you ordered with" /></div>
              <Button onClick={() => void track(number, phone)} disabled={busy || !number || !phone} className="rounded">
                <ClipboardList className="h-4 w-4" aria-hidden="true" /> {busy ? "Checking…" : "Track order"}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {order && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{order.orderNumber}</h2>
                  <p className="text-xs text-muted-foreground">Placed {fmtDateTime(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4">
                <Timeline order={order} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold">Order details</h3>
              <div className="mt-3 divide-y text-sm">
                {order.items.map((i, n) => (
                  <div key={n} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-semibold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.variant}</p>
                    </div>
                    <p className="font-bold">{ghs(i.lineTotal)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{ghs(order.subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{order.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery, ${order.areaName}`}</span><span>{order.areaFee ? ghs(order.areaFee) : "GHS 0.00"}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold"><span>Total</span><span>{ghs(order.total)}</span></div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  {order.fulfilment === "PICKUP" ? <Store className="h-4 w-4 text-teal-700" aria-hidden="true" /> : <Truck className="h-4 w-4 text-teal-700" aria-hidden="true" />}
                  {order.fulfilment === "PICKUP" ? `Pickup on ${fmtDate(order.deliveryDate)}, ALS farm gate, Akuse` : `Delivery on ${fmtDate(order.deliveryDate)}, ${order.areaName}`}
                </p>
                {order.proofs.length > 0 && <p className="flex items-center gap-2"><PackageOpen className="h-4 w-4 text-teal-700" aria-hidden="true" /> Payment proof on file (kept for when ALS confirms) ({order.proofs.length} file{order.proofs.length > 1 ? "s" : ""}){order.paymentMethod ? ` · ${order.paymentMethod}` : ""}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.receiptCode ? (
                  <Button className="rounded" onClick={() => navigate("receipt", { order: order.orderNumber, phone })}>
                    <ReceiptText className="h-4 w-4" aria-hidden="true" /> View receipt
                  </Button>
                ) : order.status !== "CANCELLED" ? (
                  <p className="text-xs text-muted-foreground">Your branded receipt appears here once ALS confirms your request.</p>
                ) : null}
                <Button variant="ghost" className="rounded" onClick={() => { setOrder(null); toast({ title: "Track another order", description: "Enter the order number and phone number." }); }}>
                  Track another order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
