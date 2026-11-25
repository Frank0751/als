"use client";

// Collection dates, ALS opens dates so live fish are never sold before they are ready

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { CollectionDateDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { fmtDate } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function CalendarTab() {
  const { token } = useStaff();
  const [dates, setDates] = useState<CollectionDateDTO[] | null>(null);
  const [newDate, setNewDate] = useState("");
  const [capacity, setCapacity] = useState("25");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ dates: CollectionDateDTO[] }>("/api/admin/calendar", { token });
      setDates(res.dates);
    } catch (e) {
      toast({ title: "Could not load calendar", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    try {
      await api("/api/admin/calendar", { method: "POST", token, body: { date: newDate, capacity: Number(capacity) } });
      toast({ title: "Date opened", description: `${newDate} is now open for collection and delivery.` });
      setNewDate("");
      void load();
    } catch (e) {
      toast({ title: "Could not open date", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await api("/api/admin/calendar", { method: "PATCH", token, body: { id, ...body } });
      void load();
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const remove = async (id: string, date: string) => {
    try {
      await api(`/api/admin/calendar?id=${id}`, { method: "DELETE", token });
      toast({ title: "Removed", description: `${date} removed from the calendar.` });
      void load();
    } catch (e) {
      toast({ title: "Could not remove", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  if (!dates) return <p className="text-sm text-muted-foreground">Loading calendar…</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Customers pick from these dates at checkout. A date with <b>{`booked = capacity`}</b> is full and closes automatically.
      </p>

      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
        <div><Label htmlFor="cd-date">Open a new date</Label><Input id="cd-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1" /></div>
        <div><Label htmlFor="cd-cap">Capacity (orders)</Label><Input id="cd-cap" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 w-28" /></div>
        <Button onClick={add} disabled={!newDate} className="rounded-full">Open date</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Open?</th>
              <th className="px-3 py-2.5">Booked / capacity</th>
              <th className="px-3 py-2.5">Load</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dates.map((d) => {
              const loadPct = Math.min(100, Math.round((d.booked / d.capacity) * 100));
              return (
                <tr key={d.id} className="hover:bg-teal-50/40">
                  <td className="px-3 py-2.5 font-semibold">{fmtDate(d.date)}</td>
                  <td className="px-3 py-2.5"><Switch checked={d.isOpen} onCheckedChange={(v) => patch(d.id, { isOpen: v })} aria-label={`Toggle ${d.date}`} /></td>
                  <td className="px-3 py-2.5">
                    <Input
                      className="h-8 w-24"
                      defaultValue={String(d.capacity)}
                      onBlur={(e) => Number(e.target.value) !== d.capacity && patch(d.id, { capacity: Number(e.target.value) })}
                      inputMode="numeric"
                      aria-label={`Capacity for ${d.date}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                        <div className="h-full rounded-full bg-teal-600" style={{ width: `${loadPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{d.booked}/{d.capacity}</span>
                      {d.booked >= d.capacity && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">full</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => remove(d.id, d.date)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
