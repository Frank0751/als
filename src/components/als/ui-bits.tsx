"use client";

// Shared small UI pieces for the ALS platform

import { Star, Fish, Package, GraduationCap, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusColor, statusLabel } from "@/lib/als/format";

export function Logo({ size = 34, withText = true, light = false }: { size?: number; withText?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#0f766e" />
        <path d="M14 32c6-9 15-14 24-14 3 0 6 .5 9 1.5L44 26c5 1.5 8 4.5 9 6-1 1.5-4 4.5-9 6l3 6.5c-3 1-6 1.5-9 1.5-9 0-18-5-24-14z" fill="#ffffff" />
        <circle cx="21.5" cy="30" r="2" fill="#0f766e" />
        <path d="M47 17.5 54 12l-1.5 9" fill="#f59e0b" />
        <path d="M47 46.5 54 52l-1.5-9" fill="#f59e0b" />
      </svg>
      {withText && (
        <span className="whitespace-nowrap leading-tight">
          <span className={cn("block font-bold tracking-tight", light ? "text-white" : "text-foreground")}>Aquatic Link</span>
          <span className={cn("block text-[11px] font-medium uppercase tracking-widest", light ? "text-teal-100" : "text-teal-700")}>
            Solutions · ALS
          </span>
        </span>
      )}
    </span>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}
        />
      ))}
    </span>
  );
}

const KIND_ICONS: Record<string, typeof Fish> = { FINGERLING: Fish, MARKET: Package, TRAINING: GraduationCap };

export function ProductImage({
  src,
  alt,
  kind,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  kind?: string;
  className?: string;
}) {
  const Icon = (kind && KIND_ICONS[kind]) || ImageIcon;
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-teal-50 text-teal-600", className)}>
        <Icon className="h-10 w-10 opacity-60" aria-hidden="true" />
      </div>
    );
  }
  return (
     
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("object-cover", className)}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        statusColor(status),
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function SectionTitle({ title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      {sub && <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" aria-hidden="true" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function StockPill({ stock, unit }: { stock: number; unit: string }) {
  if (stock <= 0)
    return <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">Out of stock</span>;
  if (stock < 20)
    return <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Only {stock} left</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      {stock.toLocaleString()} in stock
    </span>
  );
}
