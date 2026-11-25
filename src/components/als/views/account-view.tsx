"use client";

// Account, optional: order history, saved details, one-tap reorder

import { useCallback, useEffect, useState } from "react";
import type { OrderDTO } from "@/lib/als/types";
import { navigate, useCart, useCustomer, type CustomerSession } from "@/lib/als/store";
import { StatusBadge } from "../ui-bits";
import { fmtDate, fmtDateTime, ghs } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { ReceiptText, ClipboardList, LogOut, RotateCcw, UserRound } from "lucide-react";

export default function AccountView() {
  const { customer, setCustomer } = useCustomer();
  const cart = useCart();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", phone: "", pin: "", email: "", city: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api<{ customer: CustomerSession; token: string }>("/api/auth/customer", {
        method: "POST",
        body: { mode, ...form },
      });
      setCustomer(res.customer);
      sessionStorage.setItem("als-customer-token", res.token);
      toast({ title: mode === "register" ? "Account created" : `Welcome back, ${res.customer.name.split(" ")[0]}!`, description: "Your orders, addresses and receipts live here." });
    } catch (e) {
      toast({ title: mode === "register" ? "Could not create account" : "Could not sign in", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const loadOrders = useCallback(async () => {
    if (!customer) return;
    try {
      const token = sessionStorage.getItem("als-customer-token") ?? "";
      const res = await api<{ orders: OrderDTO[] }>(`/api/auth/customer?phone=${encodeURIComponent(customer.phone)}`, { token, customer: true });
      setOrders(res.orders);
    } catch {
      setOrders([]);
    }
  }, [customer]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const signOut = () => {
    setCustomer(null);
    setOrders(null);
    sessionStorage.removeItem("als-customer-token");
  };

  const reorder = (o: OrderDTO) => {
    let added = 0;
    for (const i of o.items) {
      if (i.kind === "TRAINING") continue; // sessions may be gone, skip
      cart.add({
        kind: i.kind as "FINGERLING" | "MARKET",
        refId: i.refId,
        name: i.name,
        variant: i.variant,
        qty: i.qty,
        unit: i.unit,
        unitPrice: i.unitPrice,
      });
      added += 1;
    }
    toast({
      title: "Reorder started",
      description: added > 0 ? `${added} item(s) added to your cart, check quantities, then send the order on WhatsApp.` : "No reorderable items in that order.",
    });
    if (added > 0) navigate("cart");
  };

  if (!customer) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="rounded-2xl border bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-white"><UserRound className="h-6 w-6" aria-hidden="true" /></span>
            <div>
              <h1 className="text-xl font-bold">{mode === "login" ? "Sign in" : "Create an account"}</h1>
              <p className="text-xs text-muted-foreground">Optional, you never need an account to order.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {mode === "register" && (
              <div><Label htmlFor="a-name">Full name</Label><Input id="a-name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            )}
            <div><Label htmlFor="a-phone">Phone number</Label><Input id="a-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 024 123 4567" /></div>
            <div>
              <Label htmlFor="a-pin">4-digit PIN</Label>
              <Input id="a-pin" type="password" inputMode="numeric" maxLength={4} value={form.pin} onChange={(e) => set("pin", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Choose a PIN you remember" />
            </div>
            {mode === "register" && (
              <>
                <div><Label htmlFor="a-email">Email (optional)</Label><Input id="a-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                <div><Label htmlFor="a-city">Town (optional)</Label><Input id="a-city" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                <div><Label htmlFor="a-addr">Saved delivery address (optional)</Label><Input id="a-addr" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Near the market, Somanya" /></div>
              </>
            )}
            <Button onClick={submit} disabled={busy} className="rounded-full">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-center text-sm font-medium text-teal-700 hover:underline"
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
            <p className="text-center text-xs text-muted-foreground">Your PIN is stored securely and never sent to ALS staff.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone}{customer.city ? ` · ${customer.city}` : ""}{customer.address ? ` · ${customer.address}` : ""}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={signOut}><LogOut className="h-4 w-4" aria-hidden="true" /> Sign out</Button>
      </div>

      <h2 className="mt-8 text-lg font-bold">Order history &amp; receipts</h2>
      {orders === null ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No orders yet, your orders appear here the moment you send them.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(o.createdAt)} · {o.fulfilment === "PICKUP" ? "Farm pickup" : `Delivery, ${o.areaName}`} {o.deliveryDate ? `· ${fmtDate(o.deliveryDate)}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-teal-800">{ghs(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("track", { order: o.orderNumber, phone: customer.phone })}>
                    <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" /> Track
                  </Button>
                  {o.receiptCode && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("receipt", { order: o.orderNumber, phone: customer.phone })}>
                      <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" /> Receipt
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => reorder(o)}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reorder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
