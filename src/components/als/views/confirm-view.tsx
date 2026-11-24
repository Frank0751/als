"use client";

// Order confirmation — send on WhatsApp, pay, upload proof

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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Send, ClipboardList, ReceiptText, UploadCloud, Phone, Landmark, Coins } from "lucide-react";

export default function ConfirmView({ orderNumber, initialPhone = "" }: { orderNumber: string; initialPhone?: string }) {
  const { catalog } = useCatalog();
  const customer = useCustomer((s) => s.customer);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(customer?.phone ?? initialPhone);
  const [needPhone, setNeedPhone] = useState(false);
  const [method, setMethod] = useState<string>("MOMO");
  const [payRef, setPayRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
    const lines: string[] = [`Hello Aquatic Link Solutions! Here is my order:`, ``];
    lines.push(`ORDER ${order.orderNumber}`);
    order.items.forEach((i, n) => {
      lines.push(`${n + 1}. ${i.name}${i.variant ? ` (${i.variant})` : ""} — ${i.qty.toLocaleString()} ${i.unit}${i.qty === 1 ? "" : "s"} × ${ghs(i.unitPrice)} = ${ghs(i.lineTotal)}`);
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
      toast({ title: "Marked as sent", description: "ALS can see your order in the dashboard either way — it was saved the moment it was created." });
    } catch {
      /* silent */
    }
  };

  const uploadProof = async () => {
    if (!order) return;
    if (!file) {
      toast({ title: "Choose a photo first", description: "Take a screenshot or photo of your MoMo / bank confirmation.", variant: "destructive" });
      return;
    }
    if (file.size > 1_500_000) {
      toast({ title: "Photo too large", description: "Please upload a photo under 1.5 MB (a screenshot usually works).", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      await api("/api/orders", {
        method: "PATCH",
        body: { orderNumber: order.orderNumber, phone, action: "upload_proof", paymentMethod: method, paymentRef: payRef, proof: { name: file.name, dataUrl } },
      });
      toast({ title: "Proof uploaded", description: "ALS will confirm your payment and issue your branded receipt." });
      setFile(null);
      void load(phone);
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (needPhone && !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-bold">Confirm it is you</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter the phone number used on order {orderNumber}.</p>
            <div className="mt-4 flex gap-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" />
              <Button onClick={() => void load(phone)} className="rounded-full">Open</Button>
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

  const momo = catalog?.content["payment.momo"] ?? "";
  const bank = catalog?.content["payment.bank"] ?? "";
  const usd = catalog?.content["payment.usd"] ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold">Your order is saved</h1>
          <p className="text-sm text-muted-foreground">Order number <b className="text-foreground">{order.orderNumber}</b> · placed {fmtDateTime(order.createdAt)}</p>
        </div>
      </div>

      {/* step 1: WhatsApp */}
      <Card className="mt-6 border-2 border-emerald-500">
        <CardContent className="p-5">
          <h2 className="flex items-center gap-2 font-bold"><Send className="h-5 w-5 text-emerald-600" aria-hidden="true" /> Step 1 — Send the order on WhatsApp</h2>
          <p className="mt-1 text-sm text-muted-foreground">The full order is already typed for ALS — items, quantities, prices, total, date and your details. One tap sends it.</p>
          <a href={waLink(catalog?.content["contact.whatsapp_orders"] ?? "+233200000000", waText)} target="_blank" rel="noreferrer" className="mt-4 block">
            <Button size="lg" className="wa-green w-full rounded-full text-white">Open WhatsApp with my order</Button>
          </a>
          <button onClick={markSent} className="mt-2 w-full text-center text-xs font-medium text-teal-700 hover:underline">
            {sentMark || order.whatsappSent ? "✓ Marked as sent on WhatsApp" : "I have sent it — mark as sent"}
          </button>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">See the message that will be sent</summary>
            <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-stone-100 p-3 text-xs leading-relaxed">{waText}</pre>
          </details>
        </CardContent>
      </Card>

      {/* step 2: pay */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="flex items-center gap-2 font-bold"><Coins className="h-5 w-5 text-teal-700" aria-hidden="true" /> Step 2 — Pay ALS directly</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pay <b className="text-foreground">{ghs(order.total)}</b> into ALS&rsquo;s own accounts. Money never passes through anyone else. Quote your order number {order.orderNumber} as reference.</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border bg-amber-50 p-3">
              <p className="flex items-center gap-2 font-bold"><Phone className="h-4 w-4" aria-hidden="true" /> Mobile money (MoMo)</p>
              <p className="mt-1 font-mono text-xs leading-relaxed">{momo}</p>
            </div>
            <div className="rounded-lg border bg-stone-50 p-3">
              <p className="flex items-center gap-2 font-bold"><Landmark className="h-4 w-4" aria-hidden="true" /> Bank transfer (GHS)</p>
              <p className="mt-1 font-mono text-xs leading-relaxed">{bank}</p>
            </div>
            <div className="rounded-lg border bg-stone-50 p-3">
              <p className="flex items-center gap-2 font-bold"><Coins className="h-4 w-4" aria-hidden="true" /> Buyers abroad (USD)</p>
              <p className="mt-1 font-mono text-xs leading-relaxed">{usd}</p>
            </div>
          </div>

          <Separator className="my-4" />
          <h3 className="flex items-center gap-2 text-sm font-bold"><UploadCloud className="h-4 w-4 text-teal-700" aria-hidden="true" /> Upload your payment proof</h3>
          <p className="mt-1 text-xs text-muted-foreground">Screenshot or photo of your MoMo/bank confirmation. Only ALS staff can see it, and only ALS staff can mark an order as paid.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-method">Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="p-method" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOMO">Mobile money (MoMo)</SelectItem>
                  <SelectItem value="BANK">Bank transfer (GHS)</SelectItem>
                  <SelectItem value="USD">USD transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-ref">Transaction reference (optional)</Label>
              <Input id="p-ref" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. MP260912.1432.A12345" className="mt-1" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="max-w-xs"
              aria-label="Payment proof image"
            />
            <Button onClick={uploadProof} disabled={uploading} className="rounded-full">
              {uploading ? "Uploading…" : "Upload proof"}
            </Button>
          </div>
          {order.proofs.length > 0 && (
            <p className="mt-2 text-xs font-medium text-emerald-700">✓ {order.proofs.length} proof file(s) uploaded{order.paymentRef ? ` · ref ${order.paymentRef}` : ""}</p>
          )}
        </CardContent>
      </Card>

      {/* step 3: what happens next */}
      <Card className="mt-4">
        <CardContent className="p-5">
          <h2 className="font-bold">What happens next</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-bold text-teal-700">1.</span> ALS confirms your payment in the dashboard and issues a branded receipt with a verification code.</li>
            <li className="flex gap-2"><span className="font-bold text-teal-700">2.</span> You get an email at every stage, and you can track the order any time with the order number and your phone number.</li>
            <li className="flex gap-2"><span className="font-bold text-teal-700">3.</span> {order.fulfilment === "PICKUP" ? `Collect on ${fmtDate(order.deliveryDate)} at the ALS farm gate, Akuse.` : `We deliver on ${fmtDate(order.deliveryDate)} to ${order.areaName}.`}</li>
            {order.items.some((i) => i.kind === "TRAINING") && (
              <li className="flex gap-2"><span className="font-bold text-teal-700">4.</span> Your receipt doubles as an admission slip — show the code at the gate. Online course participants receive their joining link by email.</li>
            )}
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-full" onClick={() => navigate("track", { order: order.orderNumber, phone })}>
              <ClipboardList className="h-4 w-4" aria-hidden="true" /> Track this order
            </Button>
            {order.receiptCode && (
              <Button variant="outline" className="rounded-full" onClick={() => navigate("receipt", { order: order.orderNumber, phone })}>
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
