"use client";

// Stock & prices, manage stock, prices, visibility; see what is running low

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductDTO } from "@/lib/als/types";
import { useStaff } from "@/lib/als/store";
import { api } from "@/lib/als/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ghs } from "@/lib/als/format";

export default function ProductsTab() {
  const { token } = useStaff();
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const [edits, setEdits] = useState<Record<string, { stock?: string; price?: string }>>({});

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ products: ProductDTO[] }>("/api/admin/products", { token });
      setProducts(res.products);
    } catch (e) {
      toast({ title: "Could not load products", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (id: string) => {
    const edit = edits[id];
    if (!edit) return;
    try {
      await api("/api/admin/products", {
        method: "PATCH",
        token,
        body: {
          id,
          ...(edit.stock !== undefined && edit.stock !== "" ? { stock: Number(edit.stock) } : {}),
          ...(edit.price !== undefined && edit.price !== "" ? { price: Number(edit.price) } : {}),
        },
      });
      toast({ title: "Saved", description: "Product updated and logged." });
      setEdits((e) => ({ ...e, [id]: {} }));
      void load();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [edits, token, load]);

  const toggle = useCallback(async (id: string, field: "active" | "featured", value: boolean) => {
    try {
      await api("/api/admin/products", { method: "PATCH", token, body: { id, [field]: value } });
      void load();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token, load]);

  const groups = useMemo(() => {
    const all = products ?? [];
    return [
      { key: "FINGERLING", label: "Fingerlings", items: all.filter((p) => p.kind === "FINGERLING") },
      { key: "MARKET", label: "Marketplace", items: all.filter((p) => p.kind === "MARKET") },
    ];
  }, [products]);

  if (!products) return <p className="text-sm text-muted-foreground">Loading products…</p>;

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.key}>
          <h2 className="mb-2 font-bold">{g.label}</h2>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Stock</th>
                  <th className="px-3 py-2.5">Price (GHS)</th>
                  <th className="px-3 py-2.5 text-center">Visible</th>
                  <th className="px-3 py-2.5 text-center">Featured</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {g.items.map((p) => {
                  const edit = edits[p.id] ?? {};
                  const dirty = (edit.stock !== undefined && edit.stock !== "") || (edit.price !== undefined && edit.price !== "");
                  return (
                    <tr key={p.id} className="hover:bg-teal-50/40">
                      <td className="max-w-56 px-3 py-2.5">
                        <p className="font-semibold">{p.name}</p>
                        {p.stock === 0 && <Badge className="mt-0.5 bg-red-100 text-red-800 hover:bg-red-100">out of stock</Badge>}
                        {p.stock > 0 && p.stock < 20 && <Badge className="mt-0.5 bg-amber-100 text-amber-900 hover:bg-amber-100">low</Badge>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{p.category}</td>
                      <td className="px-3 py-2.5">
                        <Input
                          className="h-8 w-28"
                          value={edit.stock ?? String(p.stock)}
                          onChange={(e) => setEdits((m) => ({ ...m, [p.id]: { ...edit, stock: e.target.value } }))}
                          inputMode="numeric"
                          aria-label={`Stock for ${p.name}`}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Input
                          className="h-8 w-24"
                          value={edit.price ?? String(p.price)}
                          onChange={(e) => setEdits((m) => ({ ...m, [p.id]: { ...edit, price: e.target.value } }))}
                          inputMode="decimal"
                          aria-label={`Price for ${p.name}`}
                        />
                        {p.priceTiers && <p className="mt-0.5 text-[10px] text-muted-foreground">tiers: {p.priceTiers.map((t) => `${t.label}→${ghs(t.price)}`).join(", ")}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-center"><Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, "active", v)} aria-label={`Visible ${p.name}`} /></td>
                      <td className="px-3 py-2.5 text-center"><Switch checked={p.featured} onCheckedChange={(v) => toggle(p.id, "featured", v)} aria-label={`Featured ${p.name}`} /></td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => save(p.id)}
                          disabled={!dirty}
                          className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Quantity-discount tiers for fingerlings change with batch pricing, ask ALS management before editing tiers; stock and prices can be updated here at any time.</p>
    </div>
  );
}
