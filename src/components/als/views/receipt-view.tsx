"use client";

// Receipt, branded, with QR verification code, printable as PDF, shareable

import { useCallback, useEffect, useState } from "react";
import type { OrderDTO } from "@/lib/als/types";
import { navigate, useCustomer } from "@/lib/als/store";
import { useCatalog } from "../catalog-context";
import { fmtDate, fmtDateTime, ghs, statusLabel, waLink } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Logo } from "../ui-bits";
import QRCode from "qrcode";
import { Download, Share2, ShieldCheck, BadgeCheck } from "lucide-react";

function ReceiptDoc({ order, qrDataUrl }: { order: OrderDTO; qrDataUrl: string | null }) {
  const { content } = useCatalog();
  return (
    <div className="print-area rounded-2xl border-2 border-teal-700 bg-white">
      <div className="rounded-t-2xl bg-teal-800 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <Logo light />
          <div className="text-right text-xs text-teal-100">
            <p className="font-bold uppercase tracking-widest">Official receipt</p>
            <p>{content("contact.location")}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipt no.</p>
            <p className="text-lg font-extrabold">{order.orderNumber}{order.receiptCode ? ` · ${order.receiptCode}` : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Issued {fmtDateTime(order.receiptIssuedAt ?? order.createdAt)}</p>
          </div>
          {qrDataUrl && (
            <div className="text-center">
              { }
              <img src={qrDataUrl} alt="Scan to verify this receipt" className="h-24 w-24 rounded border" />
              <p className="mt-1 text-[10px] text-muted-foreground">Scan to verify</p>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Received from:</span> <b>{order.customerName}</b></p>
          <p><span className="text-muted-foreground">Phone:</span> <b>{order.customerPhone}</b></p>
          <p><span className="text-muted-foreground">Payment:</span> <b>{order.paymentMethod === "MOMO" ? "Mobile money (MoMo)" : order.paymentMethod === "BANK" ? "Bank transfer (GHS)" : order.paymentMethod === "USD" ? "USD transfer" : "Direct payment"}</b></p>
          <p><span className="text-muted-foreground">Status:</span> <b>{statusLabel(order.status)}</b></p>
        </div>

        <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((i, n) => (
              <tr key={n}>
                <td className="py-2">
                  <p className="font-semibold">{i.name}</p>
                  {i.variant && i.variant !== ", " && <p className="text-xs text-muted-foreground">{i.variant}</p>}
                </td>
                <td className="py-2 text-center">{i.qty.toLocaleString()} {i.unit}</td>
                <td className="py-2 text-right">{ghs(i.unitPrice)}</td>
                <td className="py-2 text-right font-bold">{ghs(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="py-1.5 text-right text-muted-foreground">Subtotal</td>
              <td className="py-1.5 text-right">{ghs(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="py-1.5 text-right text-muted-foreground">{order.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery, ${order.areaName}`}</td>
              <td className="py-1.5 text-right">{order.areaFee ? ghs(order.areaFee) : "GHS 0.00"}</td>
            </tr>
            <tr>
              <td colSpan={3} className="py-2 text-right font-extrabold">TOTAL PAID</td>
              <td className="py-2 text-right text-lg font-extrabold text-teal-800">{ghs(order.total)}</td>
            </tr>
          </tfoot>
        </table>
        </div>

        <div className="mt-4 rounded-lg bg-teal-50 p-3 text-xs leading-relaxed text-teal-900">
          <p className="flex items-center gap-1.5 font-bold"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verify this receipt</p>
          <p className="mt-1">
            Anyone can check this receipt on our website using the “Verify receipt” page and the code <b className="font-mono">{order.receiptCode}</b>, so a receipt cannot be faked.
          </p>
        </div>

        {order.items.some((i) => i.kind === "TRAINING") && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <b>Admission slip:</b> this receipt admits you to the training on it. Show the code at the gate.
          </p>
        )}

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Thank you for farming with Aquatic Link Solutions, quality tilapia fingerlings, sustainable fish farming. This receipt was produced by the ALS platform.
        </p>
      </div>
    </div>
  );
}

export default function ReceiptView({ orderNumber, initialPhone = "" }: { orderNumber: string; initialPhone?: string }) {
  const customer = useCustomer((s) => s.customer);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState(customer?.phone ?? initialPhone);
  const [needPhone, setNeedPhone] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    try {
      setError(null);
      const res = await api<{ order: OrderDTO }>(`/api/orders?number=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(p)}`);
      setOrder(res.order);
      setNeedPhone(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load the receipt.";
      setError(msg);
      if (msg.includes("match")) setNeedPhone(true);
    }
  }, [orderNumber]);

  useEffect(() => {
    const p = customer?.phone || initialPhone || phone;
    if (orderNumber && p) void load(p);
    else setNeedPhone(true);
  }, [orderNumber]);

  useEffect(() => {
    if (!order?.receiptCode) return;
    const url = `${window.location.origin}/#/verify?code=${encodeURIComponent(order.receiptCode)}`;
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#0f766e", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [order?.receiptCode]);

  if (needPhone && !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-lg font-bold">Open your receipt</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the phone number used on order {orderNumber}.</p>
          <div className="mt-4 flex gap-2">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" />
            <Button onClick={() => void load(phone)} className="rounded-full">Open</Button>
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-muted-foreground">{error ?? "Loading receipt…"}</div>;
  }

  if (!order.receiptCode) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <BadgeCheck className="mx-auto h-10 w-10 text-teal-700" aria-hidden="true" />
        <p className="mt-3 font-bold">Receipt not issued yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          ALS issues your branded receipt as soon as your payment is confirmed. Upload your payment proof on the order page and it usually takes one working day.
        </p>
        <Button className="mt-4 rounded-full" onClick={() => navigate("track", { order: order.orderNumber, phone })}>Track the order</Button>
      </div>
    );
  }

  const shareText = `Aquatic Link Solutions receipt ${order.orderNumber} (${ghs(order.total)}), verify with code ${order.receiptCode} on our site.`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Your receipt</h1>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={() => window.print()}>
            <Download className="h-4 w-4" aria-hidden="true" /> Print / save as PDF
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank"); toast({ title: "Opening WhatsApp", description: "Share your receipt with anyone in one tap." }); }}>
            <Share2 className="h-4 w-4" aria-hidden="true" /> Share on WhatsApp
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(`ALS Receipt ${order.orderNumber}`)}&body=${encodeURIComponent(shareText)}`; }}>
            Share by email
          </Button>
        </div>
      </div>
      <ReceiptDoc order={order} qrDataUrl={qr} />
    </div>
  );
}
