// Formatting + pricing helpers for the ALS platform

import type { PriceTier } from "./types";

export function ghs(n: number): string {
  return `GHS ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ghsShort(n: number): string {
  return `GHS ${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ", ";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return `${DOWS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return ", ";
  const d = new Date(iso);
  const h = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${fmtDate(iso)} · ${h12}:${mm} ${ampm}`;
}

export function qtyLabel(qty: number, unit: string): string {
  return `${qty.toLocaleString("en-US")} ${unit}${qty === 1 ? "" : unit.endsWith("pair") ? "s" : ""}`;
}

/** Resolve the tier price for a quantity. Falls back to base price. */
export function unitPriceFor(tiers: PriceTier[] | null | undefined, base: number, qty: number): number {
  if (!tiers || tiers.length === 0) return base;
  let price = base;
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  for (const t of sorted) {
    if (qty >= t.minQty) price = t.price;
  }
  return price;
}

export function tierLabelFor(tiers: PriceTier[] | null | undefined, qty: number): string {
  if (!tiers) return "";
  const sorted = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const t of sorted) if (qty >= t.minQty) return t.label;
  return "";
}

export function statusLabel(status: string): string {
  switch (status) {
    case "RECEIVED": return "Order received";
    case "PAYMENT_CONFIRMED": return "Payment confirmed";
    case "PREPARING": return "Being prepared";
    case "READY_OUT": return "Ready for pickup";
    case "OUT_FOR_DELIVERY": return "Out for delivery";
    case "COMPLETED": return "Completed";
    case "CANCELLED": return "Cancelled";
    case "PENDING_PAYMENT": return "Pending payment";
    case "CONFIRMED": return "Confirmed";
    default: return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "RECEIVED": return "bg-stone-100 text-stone-700 border-stone-200";
    case "PAYMENT_CONFIRMED": return "bg-teal-50 text-teal-800 border-teal-200";
    case "PREPARING": return "bg-amber-50 text-amber-800 border-amber-200";
    case "READY_OUT": return "bg-orange-50 text-orange-800 border-orange-200";
    case "OUT_FOR_DELIVERY": return "bg-orange-50 text-orange-800 border-orange-200";
    case "COMPLETED": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
    case "PENDING_PAYMENT": return "bg-amber-50 text-amber-800 border-amber-200";
    case "CONFIRMED": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    default: return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

export const ORDER_STAGES = ["RECEIVED", "PAYMENT_CONFIRMED", "PREPARING", "READY_OUT", "OUT_FOR_DELIVERY", "COMPLETED"] as const;

export function waLink(number: string, text: string): string {
  const digits = (number || "").replace(/[^0-9]/g, "").replace(/^0+/, "233");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function newOrderNumber(year: number, seq: number): string {
  return `ALS-${year}-${String(seq).padStart(4, "0")}`;
}
