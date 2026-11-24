"use client";

// Sales reports — day, week, month, by product and payment method; exportable

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { ReportsDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { fmtDate, ghs, ghsShort } from "@/lib/als/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import { Download, TrendingUp, Fish, ReceiptText, CheckCircle2 } from "lucide-react";

const PIE_COLORS = ["#0f766e", "#ea580c", "#f59e0b", "#5eead4", "#44403c"];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsTab() {
  const { token } = useStaff();
  const [data, setData] = useState<ReportsDTO | null>(null);
  const [range, setRange] = useState<7 | 30 | 90>(30);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api<ReportsDTO>("/api/admin/reports", { token }));
    } catch (e) {
      toast({ title: "Could not load reports", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <p className="text-sm text-muted-foreground">Loading reports…</p>;

  const dayData = data.byDay.slice(-range);
  const weekData = mergeWeeks(dayData);
  const monthData = mergeMonths(dayData);

  const exportDay = () =>
    downloadCsv(`als-sales-by-day-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Date", "Orders", "Total GHS"],
      ...dayData.map((d) => [d.date, d.count, d.total]),
    ]);

  const exportProducts = () =>
    downloadCsv(`als-sales-by-product-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Product", "Quantity", "Total GHS"],
      ...data.byProduct.map((p) => [p.name, p.qty, p.total]),
    ]);

  const exportMethods = () =>
    downloadCsv(`als-sales-by-method-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Payment method", "Total GHS"],
      ...data.byMethod.map((m) => [m.method, m.total]),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { icon: TrendingUp, label: "Revenue (all time)", value: ghs(data.totals.revenue) },
          { icon: ReceiptText, label: "Orders", value: String(data.totals.orders) },
          { icon: Fish, label: "Fingerlings sold", value: data.totals.fingerlingsSold.toLocaleString() },
          { icon: CheckCircle2, label: "Completed", value: String(data.totals.completed) },
        ].map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <t.icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
              <p className="mt-2 text-xl font-extrabold">{t.value}</p>
              <p className="text-xs text-muted-foreground">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Sales by period</h3>
            <div className="flex gap-1.5">
              {([7, 30, 90] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${range === r ? "border-teal-700 bg-teal-700 text-white" : "bg-white text-stone-600"}`}>
                  Last {r} days
                </button>
              ))}
              <Button size="sm" variant="outline" className="rounded-full" onClick={exportDay}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Excel/CSV
              </Button>
            </div>
          </div>
          <Tabs3 label="Daily" data={dayData} xKey="date" />
          <Tabs3 label="Weekly" data={weekData} xKey="week" />
          <Tabs3 label="Monthly" data={monthData} xKey="month" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">By payment method</h3>
              <Button size="sm" variant="outline" className="rounded-full" onClick={exportMethods}><Download className="h-3.5 w-3.5" aria-hidden="true" /> CSV</Button>
            </div>
            {data.byMethod.length > 0 ? (
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byMethod.map((m) => ({ name: methodName(m.method), value: m.total }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {data.byMethod.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip formatter={(v: number) => ghsShort(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="py-8 text-center text-sm text-muted-foreground">No confirmed payments yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Top products</h3>
              <Button size="sm" variant="outline" className="rounded-full" onClick={exportProducts}><Download className="h-3.5 w-3.5" aria-hidden="true" /> CSV</Button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.byProduct.map((p) => (
                    <tr key={p.name}>
                      <td className="py-2 pr-2">{p.name}</td>
                      <td className="py-2 text-right">{p.qty.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold">{ghsShort(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Exports are CSV files that open directly in Excel. Reports exclude cancelled orders.</p>
    </div>
  );
}

function methodName(m: string): string {
  return m === "MOMO" ? "Mobile money" : m === "BANK" ? "Bank (GHS)" : m === "USD" ? "USD transfer" : m;
}

function shortDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function mergeWeeks(data: { date: string; total: number; count: number }[]) {
  const out: { week: string; total: number; count: number }[] = [];
  for (const d of data) {
    const dt = new Date(`${d.date}T12:00:00`);
    const monday = new Date(dt);
    monday.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const found = out.find((w) => w.week === key);
    if (found) {
      found.total = Math.round((found.total + d.total) * 100) / 100;
      found.count += d.count;
    } else out.push({ week: key, total: d.total, count: d.count });
  }
  return out;
}

function mergeMonths(data: { date: string; total: number; count: number }[]) {
  const out: { month: string; total: number; count: number }[] = [];
  for (const d of data) {
    const key = d.date.slice(0, 7);
    const found = out.find((m) => m.month === key);
    if (found) {
      found.total = Math.round((found.total + d.total) * 100) / 100;
      found.count += d.count;
    } else out.push({ month: key, total: d.total, count: d.count });
  }
  return out;
}

function Tabs3({ label, data, xKey }: { label: string; data: Record<string, unknown>[]; xKey: string }) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} tickFormatter={(v: string) => (xKey === "date" ? shortDay(v) : xKey === "week" ? shortDay(v) : v)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
            <ChartTooltip formatter={(v: number) => [ghs(v), "Sales"]} labelFormatter={(l: string) => fmtDate(l)} />
            <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
