"use client";

// Client stores: routing, cart, customer + staff sessions

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderItemDTO, StaffDTO } from "./types";
import { stashPhone, viewToHref } from "./routes";

// ---------- routing ----------
// Real URLs through the Next.js App Router. RouteBridge (in the site shell)
// keeps `view` and `params` in step with the address bar and hands this
// store the router's push function.

export type Route = { view: string; params: Record<string, string> };

type Pusher = (href: string) => void;
let push: Pusher | null = null;

export function setRouterPush(p: Pusher | null) {
  push = p;
}

type RouteStore = {
  view: string;
  params: Record<string, string>;
  navigate: (view: string, params?: Record<string, string>) => void;
  sync: (r: Route) => void;
};

export const useRoute = create<RouteStore>((set) => ({
  view: "home",
  params: {},
  navigate: (view, params) => {
    stashPhone(params?.phone);
    const href = viewToHref(view, params);
    if (push) push(href);
    else window.location.assign(href);
  },
  sync: (r) => set({ view: r.view, params: r.params }),
}));

export function navigate(view: string, params?: Record<string, string>) {
  useRoute.getState().navigate(view, params);
}

// ---------- cart ----------

export type CartItem = {
  kind: "FINGERLING" | "MARKET" | "TRAINING";
  refId: string;
  name: string;
  variant: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  sessionId?: string;
  date?: string | null;
  maxQty?: number;
};

type CartStore = {
  items: CartItem[];
  add: (item: Omit<CartItem, "lineTotal">) => void;
  setQty: (refId: string, sessionId: string | undefined, qty: number) => void;
  remove: (refId: string, sessionId?: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const items = [...get().items];
        const existing = items.find((i) => i.refId === item.refId && i.sessionId === item.sessionId);
        if (existing) {
          existing.qty = Math.min(existing.qty + item.qty, item.maxQty ?? 999999999);
          existing.unitPrice = item.unitPrice;
          existing.variant = item.variant;
          existing.date = item.date ?? existing.date;
          existing.lineTotal = Math.round(existing.qty * existing.unitPrice * 100) / 100;
        } else {
          items.push({ ...item, lineTotal: Math.round(item.qty * item.unitPrice * 100) / 100 });
        }
        set({ items });
      },
      setQty: (refId, sessionId, qty) => {
        const items = get()
          .items.map((i) =>
            i.refId === refId && i.sessionId === sessionId
              ? { ...i, qty, lineTotal: Math.round(qty * i.unitPrice * 100) / 100 }
              : i
          )
          .filter((i) => i.qty > 0);
        set({ items });
      },
      remove: (refId, sessionId) => {
        set({ items: get().items.filter((i) => !(i.refId === refId && i.sessionId === sessionId)) });
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => Math.round(get().items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100,
    }),
    { name: "als-cart" }
  )
);

// ---------- customer session ----------

export type CustomerSession = { id: string; name: string; phone: string; email: string | null; city: string | null; address: string | null };

type CustomerStore = {
  customer: CustomerSession | null;
  setCustomer: (c: CustomerSession | null) => void;
};

export const useCustomer = create<CustomerStore>()(
  persist(
    (set) => ({
      customer: null,
      setCustomer: (c) => set({ customer: c }),
    }),
    { name: "als-customer" }
  )
);

// ---------- staff session ----------

type StaffStore = {
  staff: StaffDTO | null;
  token: string | null;
  setStaff: (s: StaffDTO | null, token: string | null) => void;
};

export const useStaff = create<StaffStore>()(
  persist(
    (set) => ({
      staff: null,
      token: null,
      setStaff: (s, token) => set({ staff: s, token }),
    }),
    { name: "als-staff" }
  )
);

// ---------- guest details draft (checkout) ----------

type CheckoutDraft = {
  name: string; phone: string; email: string; city: string;
  fulfilment: "PICKUP" | "DELIVERY"; areaName: string; deliveryDate: string;
  paymentMethod: string; notes: string;
};

const emptyDraft: CheckoutDraft = { name: "", phone: "", email: "", city: "", fulfilment: "PICKUP", areaName: "", deliveryDate: "", paymentMethod: "", notes: "" };

type CheckoutStore = {
  draft: CheckoutDraft;
  set: (patch: Partial<CheckoutDraft>) => void;
  reset: () => void;
};

export const useCheckout = create<CheckoutStore>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      set: (patch) => set((st) => ({ draft: { ...st.draft, ...patch } })),
      reset: () => set({ draft: emptyDraft }),
    }),
    { name: "als-checkout" }
  )
);

// ---------- helpers ----------

export function itemsToOrderItems(items: CartItem[]): OrderItemDTO[] {
  return items.map((i) => ({
    kind: i.kind,
    refId: i.refId,
    name: i.name,
    variant: i.variant,
    qty: i.qty,
    unit: i.unit,
    unitPrice: i.unitPrice,
    lineTotal: Math.round(i.qty * i.unitPrice * 100) / 100,
    date: i.date ?? null,
  }));
}
