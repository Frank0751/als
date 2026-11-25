"use client";

// Request confirmation: saved to ALS, send on WhatsApp, what happens next.
// No online payment in this phase (CLAUDE.md section 4); the proof-upload
// backend action is kept so online payment can be added later without a rebuild.

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderDTO } from "@/lib/als/types";
import { navigate, useCustomer } from "@/lib/als/store";
import { useCatalog } from "../catalog-context";
import { StatusBadge } from "../ui-bits";
import { fmtDate, fmtDateTime, ghs, waLink } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Send, ClipboardList, ReceiptText } from "lucide-react";

export default function ConfirmView({ orderNumber, initialPhone = "" }: { orderNumber: string; initialPhone?: string }) {
  const { catalog } = useCatalog();
  const customer = useCustomer((s) => s.customer);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(customer?.phone ?? initialPhone);
  const [needPhone, setNeedPhone] = useState(false);
  const [sentMark, setSentMark] = useState(false);

  const load = useCallback(async (p: string) => {
    try {
      setError(null);
      const res = await api<{ order: OrderDTO }>(`/api/orders?number=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(p)}`);
      setOrder(res.order);
      setNeedPhone(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load the order.";
      if (msg.includes("match")) setNeedPhone(true);
      setError(msg);
    }
  }, [orderNumber]);

  useEffect(() => {
    const p = customer?.phone || initialPhone || phone;
    if (orderNumber && p) void load(p);
    else setNeedPhone(true);
  }, [orderNumber]);

  const waText = useMemo(() => {
    if (!order) return "";
    const lines: string[] = [`Hello Aquatic Link Solutions! Here is my order request:`, ``];
    lines.push(`ORDER ${order.orderNumber}`);
    order.items.forEach((i, n) => {
      lines.push(`${n + 1}. ${i.name}${i.variant ? ` (${i.variant})` : ""}, ${i.qty.toLocaleString()} ${i.unit}${i.qty === 1 ? "" : "s"} × ${ghs(i.unitPrice)} = ${ghs(i.lineTotal)}`);
    });
    lines.push(``);
    lines.push(`${order.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery to ${order.areaName}`} on ${fmtDate(order.deliveryDate)}`);
    if (order.notes) lines.push(`Note: ${order.notes}`);
    lines.push(``);
    lines.push(`Subtotal: ${ghs(order.subtotal)}`);
    lines.push(order.fulfilment === "DELIVERY" ? `Delivery (${order.areaName}): ${ghs(order.areaFee)}` : `Pickup fee: GHS 0.00`);
    lines.push(`TOTAL: ${ghs(order.total)}`);
    lines.push(``);
    lines.push(`Name: ${order.customerName}`);
    lines.push(`Phone: ${order.customerPhone}`);
    return lines.join("\n");
  }, [order]);

  const markSent = async () => {
    if (!order) return;
    try {
      await api("/api/orders", { method: "PATCH", body: { orderNumber: order.orderNumber, phone, action: "mark_whatsapp_sent" } });
      setSentMark(true);
      toast({ title: "Marked as sent", description: "ALS can see your request in the dashboard either way, it was saved the moment it was created." });
    } catch {
      /* silent */
    }
  };

  if (needPhone && !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-bold">Confirm it is you</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the phone number used on request {orderNumber}.</p>
            <div className="mt-4 flex gap-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" />
              <Button onClick={() => void load(phone)} className="rounded">Open</Button>
            </div>
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        {error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-muted-foreground">Loading your order…</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold">Your order request is saved</h1>
          <p className="text-sm text-muted-foreground">Reference <b className="text-foreground">{order.orderNumber}</b> · created {fmtDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* step 1: WhatsApp */}
      <Card className="mt-6 border-2 border-emerald-500">
        <CardContent className="p-5">
          <h2 className="flex items-center justify-center gap-2 font-bold"><Send className="h-5 w-5 text-emerald-600" aria-hidden="true" /> Step 1: Send the request on WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">The full request is already typed for ALS, items, sizes, quantities, prices, total, date and your details. One tap sends it.</p>
          <a href={waLink(catalog?.content["contact.whatsapp_orders"] ?? "+233200000000", waText)} target="_blank" rel="noreferrer" className="mt-4 block">
            <Button size="lg" className="wa-green w-full rounded text-white">Open WhatsApp with my request</Button>
          </a>
          <button onClick={markSent} className="mt-2 w-full text-center text-xs font-medium text-teal-700 hover:underline">
            {sentMark || order.whatsappSent ? "✓ Marked as sent on WhatsApp" : "I have sent it, mark as sent"}
          </button>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">See the message that will be sent</summary>
            <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded bg-stone-100 p-3 text-xs leading-relaxed">{waText}</pre>
          </details>
        </CardContent>
      </Card>

      {/* step 2: what happens next */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-bold">What happens next</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-teal-700">1.</span> ALS checks availability and confirms your request on WhatsApp or by phone. Nothing is charged yet: payment details are shared directly by ALS staff only when your request is confirmed.</li>
            <li className="flex gap-2"><span className="font-bold text-teal-700">2.</span> {order.fulfilment === "PICKUP" ? `Collect on ${fmtDate(order.deliveryDate)} at the ALS farm gate, Akuse.` : `We deliver on ${fmtDate(order.deliveryDate)} to ${order.areaName}.`} Fingerlings travel in oxygen-bagged lots.</li>
            <li className="flex gap-2"><span className="font-bold text-teal-700">3.</span> After ALS confirms, a branded receipt is issued with a code you can verify on this site, and you can track the request any time with the reference and your phone number.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="rounded" onClick={() => navigate("track", { order: order.orderNumber, phone })}>
              <ClipboardList className="h-4 w-4" aria-hidden="true" /> Track this request
            </Button>
            {order.receiptCode && (
              <Button variant="outline" className="rounded" onClick={() => navigate("receipt", { order: order.orderNumber, phone })}>
                <ReceiptText className="h-4 w-4" aria-hidden="true" /> View receipt
              </Button>
            )}
            <StatusBadge status={order.status} className="ml-auto self-center" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
