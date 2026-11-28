"use client";

// Marketplace: categories, search, filters, product details, "Notify me". No reviews until ALS has real ones.

import { useMemo, useState } from "react";
import { useCatalog } from "../catalog-context";
import { useCart, navigate, useRoute } from "@/lib/als/store";
import type { ProductDTO } from "@/lib/als/types";
import { ProductImage, SectionTitle, StockPill } from "../ui-bits";
import { ghs, ghsShort } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api, throttle } from "@/lib/als/api";
import { Search, Bell, Share2 } from "lucide-react";

function NotifyDialog({ product, open, setOpen }: { product: ProductDTO; open: boolean; setOpen: (v: boolean) => void }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!throttle("notify")) return;
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/api/notify", { method: "POST", body: { ...form, productId: product.id, website: "" } });
      toast({ title: "You are on the list", description: res.message });
      setOpen(false);
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Notify me, {product.name}</DialogTitle>
          <DialogDescription>ALS will message you on WhatsApp the moment this item is back in stock.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label htmlFor="n-name">Your name</Label><Input id="n-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><Label htmlFor="n-phone">Phone / WhatsApp</Label><Input id="n-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <input type="text" name="website" readOnly hidden aria-hidden="true" tabIndex={-1} autoComplete="off" />
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy} className="w-full rounded sm:w-auto">{busy ? "Saving…" : "Notify me"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product, open, setOpen }: { product: ProductDTO; open: boolean; setOpen: (v: boolean) => void }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { content } = useCatalog();
  const out = product.stock <= 0;

  const shareText = `${product.name}, ${ghs(product.price)} at Aquatic Link Solutions (Akuse). Order fingerlings, equipment and training online.`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const addNow = () => {
    if (out) return;
    if (qty > product.stock) {
      toast({ title: "Not enough stock", description: `Only ${product.stock} left right now.`, variant: "destructive" });
      return;
    }
    add({ kind: "MARKET", refId: product.id, name: product.name, variant: product.unit, qty, unit: product.unit, unitPrice: product.price, maxQty: product.stock });
    toast({ title: "Added to request list", description: `${qty} × ${product.name}` });
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-left">{product.name}</DialogTitle>
            <DialogDescription className="text-left">{product.category}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <ProductImage src={product.imageUrl} alt={product.name} kind={product.kind} className="aspect-square w-full rounded border object-cover" />
              <div className="mt-3 flex items-center gap-2 text-xs">
                <button
                  className="inline-flex items-center gap-1 rounded border px-2.5 py-1 hover:bg-stone-50"
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
                    window.open(url, "_blank");
                  }}
                >
                  <Share2 className="h-3 w-3" aria-hidden="true" /> Share on WhatsApp
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              <p className="mt-3 text-2xl font-extrabold text-teal-800">{ghs(product.price)}<span className="text-sm font-medium text-muted-foreground"> /{product.unit}</span></p>
              <div className="mt-2"><StockPill stock={product.stock} unit={product.unit} /></div>
              {!out && (
                <div className="mt-4 flex items-center gap-2">
                  <Input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Math.floor(Number(e.target.value) || 1))))} className="w-24" aria-label="Quantity" />
                  <Button className="flex-1 rounded" onClick={addNow}>Add to request list</Button>
                </div>
              )}
              {out && (
                <Button className="mt-4 w-full rounded" variant="outline" onClick={() => setNotifyOpen(true)}>
                  <Bell className="h-4 w-4" aria-hidden="true" /> Notify me when back in stock
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <NotifyDialog product={product} open={notifyOpen} setOpen={setNotifyOpen} />
    </>
  );
}

export default function MarketplaceView() {
  const { catalog } = useCatalog();
  const { params } = useRoute();
  const [category, setCategory] = useState<string>(params.category && params.category !== "undefined" ? params.category : "All");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("all");
  const [selected, setSelected] = useState<ProductDTO | null>(null);

  const products = useMemo(() => catalog?.products.filter((p) => p.kind === "MARKET") ?? [], [catalog]);
  const categories = useMemo(() => ["All", ...[...new Set(products.map((p) => p.category))]], [products]);

  const filtered = products.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    if (query && !(`${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()))) return false;
    if (maxPrice === "under200" && p.price >= 200) return false;
    if (maxPrice === "200to600" && (p.price < 200 || p.price > 600)) return false;
    if (maxPrice === "over600" && p.price <= 600) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <SectionTitle
        title="Nets, harvesting, feed accessories, aeration & safety"
        sub="Search by name or filter by category and price. Out-of-stock items show “Notify me”, so ALS knows what customers want."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nets, feed, aerators…" className="pl-9" aria-label="Search products" />
        </div>
        <Select value={maxPrice} onValueChange={setMaxPrice}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Price filter">
            <SelectValue placeholder="Any price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any price</SelectItem>
            <SelectItem value="under200">Under GHS 200</SelectItem>
            <SelectItem value="200to600">GHS 200 - 600</SelectItem>
            <SelectItem value="over600">Over GHS 600</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded border px-4 py-2.5 text-sm font-medium transition-colors ${category === c ? "border-teal-700 bg-teal-700 text-white" : "bg-white text-stone-700 hover:border-teal-600"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No products match your search or filters.</p>
          <Button
            variant="outline"
            className="mt-4 rounded border-teal-800 text-teal-800 hover:bg-teal-50"
            onClick={() => { setQuery(""); setCategory("All"); setMaxPrice("all"); }}
          >
            Clear search and filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                aria-label={`View details and price of ${p.name}`}
                className="group flex w-full cursor-pointer flex-col overflow-hidden rounded border bg-card text-left transition-colors hover:border-teal-700"
              >
                <div className="relative">
                  <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-40 w-full" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-bold leading-snug group-hover:underline">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-extrabold text-teal-800">{ghsShort(p.price)}</p>
                    <StockPill stock={p.stock} unit={p.unit} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ProductDialog product={selected} open={!!selected} setOpen={(v) => !v && setSelected(null)} />
      )}

      <div className="mt-10 rounded border bg-teal-50 p-6 text-center">
        <p className="font-bold">Can&rsquo;t find what you need?</p>
        <p className="mt-1 text-sm text-muted-foreground">ALS sources equipment for farmers on request, ask us on WhatsApp or the contact page.</p>
        <Button variant="outline" className="mt-4 rounded" onClick={() => navigate("contact")}>Ask ALS</Button>
      </div>
    </div>
  );
}
