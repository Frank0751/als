"use client";

// Marketplace — categories, search, filters, product pages, verified reviews, "Notify me"

import { useMemo, useState } from "react";
import { useCatalog } from "../catalog-context";
import { useCart, navigate, useRoute } from "@/lib/als/store";
import type { ProductDTO, ReviewDTO } from "@/lib/als/types";
import { ProductImage, SectionTitle, Stars, StockPill } from "../ui-bits";
import { ghs, ghsShort } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { api, throttle } from "@/lib/als/api";
import { Search, Bell, MessageSquareText, Share2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Notify me — {product.name}</DialogTitle>
          <DialogDescription>ALS will message you on WhatsApp the moment this item is back in stock.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label htmlFor="n-name">Your name</Label><Input id="n-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><Label htmlFor="n-phone">Phone / WhatsApp</Label><Input id="n-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          <input type="text" name="website" readOnly hidden aria-hidden="true" tabIndex={-1} autoComplete="off" />
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy} className="w-full rounded-full sm:w-auto">{busy ? "Saving…" : "Notify me"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ product, reviews, open, setOpen }: { product: ProductDTO; reviews: ReviewDTO[]; open: boolean; setOpen: (v: boolean) => void }) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { content } = useCatalog();
  const out = product.stock <= 0;

  const shareText = `${product.name} — ${ghs(product.price)} at Aquatic Link Solutions (Akuse). Order fingerlings, equipment and training online.`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const addNow = () => {
    if (out) return;
    if (qty > product.stock) {
      toast({ title: "Not enough stock", description: `Only ${product.stock} left right now.`, variant: "destructive" });
      return;
    }
    add({ kind: "MARKET", refId: product.id, name: product.name, variant: "—", qty, unit: product.unit, unitPrice: product.price, maxQty: product.stock });
    toast({ title: "Added to cart", description: `${qty} × ${product.name}` });
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
              <ProductImage src={product.imageUrl} alt={product.name} kind={product.kind} className="aspect-square w-full rounded-xl border object-cover" />
              <div className="mt-3 flex items-center gap-2 text-xs">
                <button
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 hover:bg-stone-50"
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
                  <Button className="flex-1 rounded-full" onClick={addNow}>Add to cart</Button>
                </div>
              )}
              {out && (
                <Button className="mt-4 w-full rounded-full" variant="outline" onClick={() => setNotifyOpen(true)}>
                  <Bell className="h-4 w-4" aria-hidden="true" /> Notify me when back in stock
                </Button>
              )}
              <Separator className="my-4" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><MessageSquareText className="h-4 w-4 text-teal-700" aria-hidden="true" /> Verified buyer reviews</p>
                {reviews.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No reviews yet for this item.</p>}
                <div className="mt-3 space-y-3">
                  {reviews.slice(0, 4).map((r) => (
                    <div key={r.id} className="rounded-lg border bg-stone-50 p-3">
                      <div className="flex items-center justify-between">
                        <Stars rating={r.rating} />
                        <span className="text-[11px] font-semibold text-emerald-700">✓ Verified buyer</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed">{r.comment}</p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">{r.name} — {r.location}</p>
                    </div>
                  ))}
                </div>
              </div>
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

  const reviewsFor = (productId: string) => catalog?.reviews.filter((r) => r.productId === productId) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="Marketplace"
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
            <SelectItem value="200to600">GHS 200 – 600</SelectItem>
            <SelectItem value="over600">Over GHS 600</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${category === c ? "border-teal-700 bg-teal-700 text-white" : "bg-white text-stone-700 hover:border-teal-600"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No products match. Try another search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const rs = reviewsFor(p.id);
            const avg = rs.length ? Math.round(rs.reduce((s, r) => s + r.rating, 0) / rs.length) : 0;
            return (
              <Card key={p.id} className="group flex cursor-pointer flex-col overflow-hidden pt-0 transition-shadow hover:shadow-md" onClick={() => setSelected(p)}>
                <div className="relative">
                  <ProductImage src={p.imageUrl} alt={p.name} kind={p.kind} className="h-40 w-full" />
                  {p.featured && <span className="absolute left-2 top-2"><Badge className="bg-orange-600 text-white hover:bg-orange-600">Popular</Badge></span>}
                </div>
                <CardContent className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-bold leading-snug">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted-foreground">{p.description}</p>
                  {rs.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Stars rating={avg} size={12} />
                      <span className="text-[11px] text-muted-foreground">({rs.length})</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-extrabold text-teal-800">{ghsShort(p.price)}</p>
                    <StockPill stock={p.stock} unit={p.unit} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <ProductDialog product={selected} reviews={reviewsFor(selected.id)} open={!!selected} setOpen={(v) => !v && setSelected(null)} />
      )}

      <div className="mt-10 rounded-2xl border bg-teal-50 p-6 text-center">
        <p className="font-bold">Can&rsquo;t find what you need?</p>
        <p className="mt-1 text-sm text-muted-foreground">ALS sources equipment for farmers on request — ask us on WhatsApp or the contact page.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("contact")}>Ask ALS</Button>
      </div>
    </div>
  );
}
