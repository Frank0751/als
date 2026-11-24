"use client";

// Client stores: hash routing, cart, customer + staff sessions

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderItemDTO, StaffDTO } from "./types";

// ---------- hash routing ----------

export type Route = { view: string; params: Record<string, string> };

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "home", params: {} };
  const h = window.location.hash.replace(/^#\/?/, "");
  if (!h) return { view: "home", params: {} };
  const [path, qs] = h.split("?");
  const params: Record<string, string> = {};
  if (qs) {
    for (const pair of qs.split("&")) {
      const [k, v] = pair.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    }
  }
  return { view: path || "home", params };
}

function toHash(view: string, params?: Record<string, string>): string {
  const qs = params && Object.keys(params).length
    ? "?" + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
    : "";
  return `#/${view}${qs}`;
}

type RouteStore = {
  view: string;
  params: Record<string, string>;
  navigate: (view: string, params?: Record<string, string>) => void;
  syncFromHash: () => void;
};

export const useRoute = create<RouteStore>((set) => ({
  view: "home",
  params: {},
  navigate: (view, params) => {
    window.location.hash = toHash(view, params);
    // hashchange listener fires syncFromHash
    set({ view, params: params ?? {} });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  },
  syncFromHash: () => {
    const r = parseHash();
    set({ view: r.view, params: r.params });
  },
}));

export function navigate(view: string, params?: Record<string, string>) {
  useRoute.getState().navigate(view, params);
}

if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => useRoute.getState().syncFromHash());
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
