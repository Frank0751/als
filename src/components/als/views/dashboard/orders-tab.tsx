"use client";

// Orders & payments, every order on one screen, one-click updates, payment confirmation

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminOrdersDTO, OrderDTO, OrderItemDTO } from "@/lib/als/types";
import { useStaff } from "@/lib/als/store";
import { StatusBadge } from "../../ui-bits";
import { fmtDate, fmtDateTime, ghs, statusLabel, waLink } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  MessageCircle, BadgeCheck, PackageCheck, Truck, Store, CheckCircle2, XCircle,
  Lightbulb, FileQuestion, Inbox, Eye, EyeOff,
} from "lucide-react";

const FILTERS = ["ALL", "RECEIVED", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

function nextStage(order: OrderDTO): { status: string; label: string; icon: typeof CheckCircle2 } | null {
  // WhatsApp request pipeline (CLAUDE.md section 6): New, Contacted, Confirmed, Completed
  if (order.status === "RECEIVED") return { status: "CONTACTED", label: "Mark contacted", icon: MessageCircle };
  if (order.status === "CONTACTED") return { status: "CONFIRMED", label: "Confirm request", icon: BadgeCheck };
  if (order.status === "CONFIRMED" || order.status === "PAYMENT_CONFIRMED" || order.status === "PREPARING" || order.status === "READY_OUT" || order.status === "OUT_FOR_DELIVERY") return { status: "COMPLETED", label: "Mark completed", icon: CheckCircle2 };
  return null;
}

function ProofImage({ proofId, token }: { proofId: string; token: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const load = async () => {
    if (src) return;
    try {
      const res = await api<{ dataUrl: string }>(`/api/admin/proof/${proofId}`, { token });
      setSrc(res.dataUrl);
      setShow(true);
    } catch {
      toast({ title: "Could not open proof", variant: "destructive" });
    }
  };
  return (
    <div>
      <Button size="sm" variant="outline" className="rounded" onClick={load}>
        <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View payment proof
      </Button>
      {show && src && (
         
        <img src={src} alt="Uploaded payment proof" className="mt-2 max-h-72 rounded border" />
      )}
    </div>
  );
}

function OrderDialog({ order, token, role, onDone }: { order: OrderDTO; token: string; role: string; onDone: () => void }) {
  const [method, setMethod] = useState(order.paymentMethod ?? "MOMO");
  const [ref, setRef] = useState(order.paymentRef ?? "");
  const [busy, setBusy] = useState(false);

  const act = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      await api(`/api/admin/orders/${order.orderNumber}`, { method: "PATCH", body: { action, ...extra }, token });
      toast({ title: "Done", description: `Order ${order.orderNumber} updated.` });
      onDone();
    } catch (e) {
      toast({ title: "Action failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const next = nextStage(order);
  const items = order.items as OrderItemDTO[];

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2 text-left">
          {order.orderNumber} <StatusBadge status={order.status} /> {ghs(order.total)}
        </DialogTitle>
        <DialogDescription className="text-left">
          {order.customerName} · {order.customerPhone} · placed {fmtDateTime(order.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 text-sm">
        <div className="grid gap-2 rounded border bg-stone-50 p-3 sm:grid-cols-2">
          <p><span className="text-muted-foreground">Fulfilment:</span> <b>{order.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery, ${order.areaName}`}</b></p>
          <p><span className="text-muted-foreground">Date:</span> <b>{fmtDate(order.deliveryDate)}</b></p>
          <p><span className="text-muted-foreground">Subtotal:</span> <b>{ghs(order.subtotal)}</b> <span className="text-muted-foreground">+ fee {ghs(order.areaFee)}</span></p>
          <p><span className="text-muted-foreground">WhatsApp sent:</span> <b>{order.whatsappSent ? "yes" : "not marked"}</b></p>
          {order.customerEmail && <p className="sm:col-span-2"><span className="text-muted-foreground">Email:</span> <b>{order.customerEmail}</b></p>}
          {order.notes && <p className="sm:col-span-2"><span className="text-muted-foreground">Customer note:</span> <b>{order.notes}</b></p>}
        </div>

        <div>
          <p className="font-semibold">Items</p>
          <div className="mt-1.5 divide-y rounded border">
            {items.map((i, n) => (
              <div key={n} className="flex items-start justify-between gap-2 p-2.5">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.variant}</p>
                </div>
                <p className="whitespace-nowrap font-bold">{i.qty.toLocaleString()} × {ghs(i.unitPrice)} = {ghs(i.lineTotal)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={waLink(order.customerPhone, `Hello ${order.customerName}, this is Aquatic Link Solutions about your order ${order.orderNumber} (${ghs(order.total)}).`)} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="rounded"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> WhatsApp customer</Button>
          </a>
          {order.receiptCode && <Badge variant="outline" className="self-center border-teal-200 bg-teal-50 text-teal-800">Receipt {order.receiptCode}</Badge>}
        </div>

        {order.proofs.length > 0 ? (
          <ProofImage proofId={order.proofs[0]!.id} token={token} />
        ) : order.status === "RECEIVED" ? (
          <p className="flex items-center gap-2 rounded bg-amber-50 p-2.5 text-xs text-amber-800"><FileQuestion className="h-4 w-4 shrink-0" aria-hidden="true" /> No payment proof on file yet. ALS shares payment details directly when the request is confirmed.</p>
        ) : null}

        {/* payment confirmation */}
        {!order.receiptCode && order.status !== "CANCELLED" && (
          <div className="rounded border-2 border-teal-600 bg-teal-50 p-3">
            <p className="flex items-center gap-2 font-semibold"><BadgeCheck className="h-4 w-4 text-teal-700" aria-hidden="true" /> Confirm payment against the proof above</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="pm">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="pm" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOMO">Mobile money (MoMo)</SelectItem>
                    <SelectItem value="BANK">Bank transfer (GHS)</SelectItem>
                    <SelectItem value="USD">USD transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pref">Reference</Label>
                <Input id="pref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction ref" className="mt-1" />
              </div>
            </div>
            <Button className="mt-3 w-full rounded" disabled={busy} onClick={() => act("confirm_payment", { paymentMethod: method, paymentRef: ref })}>
              {busy ? "Working…" : `Confirm payment & issue receipt, ${ghs(order.total)}`}
            </Button>
            <p className="mt-1 text-[11px] text-muted-foreground">Only ALS staff can mark an order as paid. This issues the branded receipt and emails the customer.</p>
          </div>
        )}

        {/* stage buttons */}
        {next && (
          <Button className="w-full rounded" disabled={busy} onClick={() => act("set_status", { status: next.status })}>
            <next.icon className="h-4 w-4" aria-hidden="true" /> {next.label}, notify customer
          </Button>
        )}

        {/* timeline */}
        <div>
          <p className="font-semibold">History</p>
          <ol className="mt-1.5 space-y-1.5">
            {order.events.map((e) => (
              <li key={e.id} className="rounded border bg-stone-50 p-2.5 text-xs">
                <p><b>{statusLabel(e.status)}</b>{e.actor ? `, ${e.actor}` : ""} <span className="text-muted-foreground">· {fmtDateTime(e.createdAt)}</span></p>
                {e.note && <p className="mt-0.5 text-muted-foreground">{e.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <DialogFooter>
        {role !== "STAFF" && order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
          <Button variant="destructive" disabled={busy} onClick={() => act("cancel")} className="rounded">
            <XCircle className="h-4 w-4" aria-hidden="true" /> Cancel order (restores stock)
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

export default function OrdersTab() {
  const { token, staff } = useStaff();
  const [data, setData] = useState<AdminOrdersDTO | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [selected, setSelected] = useState<OrderDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      setData(await api<AdminOrdersDTO>("/api/admin/orders", { token }));
    } catch (e) {
      toast({ title: "Could not load orders", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(() => (data?.orders ?? []).filter((o) => filter === "ALL" || o.status === filter), [data, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of data?.orders ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data]);

  if (!data) return <p className="text-sm text-muted-foreground">{busy ? "Loading orders…" : "No data."}</p>;

  const attention = data.orders.filter((o) => o.status === "RECEIVED" && o.proofs.length > 0);

  return (
    <div>
      {attention.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded border-2 border-amber-300 bg-amber-50 p-3.5">
          <BadgeCheck className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-sm text-amber-900"><b>{attention.length}</b> order(s) have payment proof waiting for your confirmation.</p>
          <Button size="sm" className="rounded" onClick={() => setFilter("RECEIVED")}>Review now</Button>
        </div>
      )}

      <Tabs defaultValue="orders">
        <TabsList className="flex w-full justify-start overflow-x-auto">
          <TabsTrigger value="orders">Orders ({data.orders.length})</TabsTrigger>
          <TabsTrigger value="demand">Notify-me ({data.demand.length})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({data.quotes.length})</TabsTrigger>
          <TabsTrigger value="inbox">Inbox ({data.inbox.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("shrink-0 rounded border px-3 py-1.5 text-xs font-semibold", filter === f ? "border-teal-700 bg-teal-700 text-white" : "bg-white text-stone-600 hover:border-teal-600")}
              >
                {f === "ALL" ? "All" : statusLabel(f)} {counts[f] ? `(${counts[f]})` : ""}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5">Order</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Fulfilment</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Total</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-teal-50/40">
                    <td className="px-3 py-2.5">
                      <button className="font-bold text-teal-800 hover:underline" onClick={() => setSelected(o)}>{o.orderNumber}</button>
                      {o.proofs.length > 0 && <Badge className="ml-1.5 bg-amber-100 text-amber-900 hover:bg-amber-100">proof</Badge>}
                    </td>
                    <td className="px-3 py-2.5">{o.customerName}<span className="block text-xs text-muted-foreground">{o.customerPhone}</span></td>
                    <td className="px-3 py-2.5 text-xs">{o.fulfilment === "PICKUP" ? "Pickup" : o.areaName}</td>
                    <td className="px-3 py-2.5 text-xs">{fmtDate(o.deliveryDate)}</td>
                    <td className="px-3 py-2.5 font-bold">{ghs(o.total)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                    <td className="px-3 py-2.5 text-right">
                      <Button size="sm" variant="outline" className="rounded" onClick={() => setSelected(o)}>Open</Button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No orders in this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="mt-4 space-y-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lightbulb className="h-4 w-4 text-teal-700" aria-hidden="true" /> “Notify me” requests show what customers want before you restock.</p>
          {data.demand.map((d) => (
            <Card key={d.id}><CardContent className="flex flex-wrap items-center justify-between gap-2 p-3.5 text-sm">
              <div><p className="font-semibold">{d.productName}</p><p className="text-xs text-muted-foreground">requested {fmtDateTime(d.createdAt)}</p></div>
              <div className="text-right"><p className="font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.phone}</p></div>
            </CardContent></Card>
          ))}
          {data.demand.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No requests yet.</p>}
        </TabsContent>

        <TabsContent value="quotes" className="mt-4 space-y-2">
          {data.quotes.map((q) => (
            <Card key={q.id}><CardContent className="p-3.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{q.org ?? q.name}</p>
                <p className="text-xs text-muted-foreground">{q.phone}{q.email ? ` · ${q.email}` : ""} · {fmtDateTime(q.createdAt)}</p>
              </div>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{q.message}</p>
            </CardContent></Card>
          ))}
          {data.quotes.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No quote requests yet.</p>}
        </TabsContent>

        <TabsContent value="inbox" className="mt-4 space-y-2">
          {data.inbox.map((m) => (
            <Card key={m.id}><CardContent className="p-3.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold"><Inbox className="mr-1.5 inline h-3.5 w-3.5 text-teal-700" aria-hidden="true" />{m.subject}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(m.createdAt)}</p>
              </div>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{m.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">,  {m.name} · {m.email ?? ""}{m.phone ? ` · ${m.phone}` : ""}</p>
            </CardContent></Card>
          ))}
          {data.inbox.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Inbox is empty.</p>}
        </TabsContent>
      </Tabs>

      {selected && (
        <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          {selected && <OrderDialog order={selected} token={token!} role={staff!.role} onDone={() => { setSelected(null); void load(); }} />}
        </Dialog>
      )}
    </div>
  );
}
