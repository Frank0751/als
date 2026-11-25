"use client";

// Training calendar + trainee lists, sessions, seats, payment status, printable lists

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { CourseDTO, BookingDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { fmtDate, ghs } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Logo, StatusBadge } from "../../ui-bits";
import { Printer, Trash2 } from "lucide-react";

function TraineeList({ courseTitle, session, bookings }: { courseTitle: string; session: SessionLite; bookings: BookingDTO[] }) {
  const paid = bookings.filter((b) => b.status === "CONFIRMED").length;
  return (
    <div className="print-area">
      <div className="mb-3 flex items-center justify-between border-b pb-3">
        <Logo />
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-bold text-foreground">Trainee list</p>
          <p>{fmtDate(session.date)} · {session.timeText}</p>
        </div>
      </div>
      <h2 className="text-lg font-bold">{courseTitle}</h2>
      <p className="text-sm text-muted-foreground">{session.location} · {bookings.length} booking(s) · {paid} paid</p>
      <div className="overflow-x-auto">
      <table className="mt-4 w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="py-2">#</th>
            <th className="py-2">Reference</th>
            <th className="py-2">Trainee</th>
            <th className="py-2">Phone</th>
            <th className="py-2">Seats</th>
            <th className="py-2">Payment</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {bookings.map((b, i) => (
            <tr key={b.id}>
              <td className="py-2">{i + 1}</td>
              <td className="py-2 font-mono text-xs">{b.reference}</td>
              <td className="py-2 font-semibold">{b.customerName}</td>
              <td className="py-2">{b.phone}</td>
              <td className="py-2">{b.seats}</td>
              <td className="py-2"><StatusBadge status={b.status} /></td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No bookings yet.</td></tr>
          )}
        </tbody>
      </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Check admission codes against receipts at the gate. Printed from the ALS platform.</p>
    </div>
  );
}

type SessionLite = { id: string; date: string; timeText: string; location: string; seats: number; booked: number };
type AdminTrainingDTO = { courses: CourseDTO[]; bookings: BookingDTO[] };

export default function TrainingTab() {
  const { token } = useStaff();
  const [data, setData] = useState<AdminTrainingDTO | null>(null);
  const [addFor, setAddFor] = useState<CourseDTO | null>(null);
  const [form, setForm] = useState({ date: "", timeText: "9:00 AM - 3:30 PM each day", location: "ALS Farm, Akuse", seats: "15" });
  const [listFor, setListFor] = useState<{ course: CourseDTO; session: SessionLite } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await api<AdminTrainingDTO>("/api/admin/training", { token }));
    } catch (e) {
      toast({ title: "Could not load training", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const addSession = async () => {
    if (!addFor) return;
    try {
      await api("/api/admin/training", {
        method: "POST",
        token,
        body: { courseId: addFor.id, date: form.date, timeText: form.timeText, location: form.location, seats: Number(form.seats) },
      });
      toast({ title: "Session added", description: `${addFor.title}, ${form.date} is now open for booking.` });
      setAddFor(null);
      setForm({ date: "", timeText: "9:00 AM - 3:30 PM each day", location: "ALS Farm, Akuse", seats: "15" });
      void load();
    } catch (e) {
      toast({ title: "Could not add session", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const patchSession = async (id: string, body: Record<string, unknown>) => {
    try {
      await api("/api/admin/training", { method: "PATCH", token, body: { kind: "session", id, ...body } });
      void load();
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const removeSession = async (id: string) => {
    try {
      await api(`/api/admin/training?id=${id}`, { method: "DELETE", token });
      void load();
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const bookingsFor = useMemo(() => {
    const map = new Map<string, BookingDTO[]>();
    for (const b of data?.bookings ?? []) {
      const arr = map.get(b.sessionId) ?? [];
      arr.push(b);
      map.set(b.sessionId, arr);
    }
    return map;
  }, [data]);

  if (!data) return <p className="text-sm text-muted-foreground">Loading training…</p>;

  return (
    <div className="space-y-6">
      {data.courses.map((c) => (
        <div key={c.id} className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">{c.title}</h2>
              <p className="text-xs text-muted-foreground">{ghs(c.fee)} per seat · {c.durationText}</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddFor(c)}>+ Add session</Button>
          </div>
          <div className="mt-3 space-y-2">
            {c.sessions.map((s) => {
              const bs = bookingsFor.get(s.id) ?? [];
              const full = s.seats - s.booked <= 0;
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-stone-50 p-3 text-sm">
                  <span className="font-semibold">{fmtDate(s.date)}</span>
                  <span className="text-xs text-muted-foreground">{s.timeText} · {s.location}</span>
                  <span className="text-xs">{s.booked}/{s.seats} booked{full ? ", full" : ""}</span>
                  {bs.length > 0 && (
                    <button className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => setListFor({ course: c, session: s })}>
                      Trainee list ({bs.length}) · print
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Input
                      className="h-8 w-16"
                      defaultValue={String(s.seats)}
                      onBlur={(e) => Number(e.target.value) !== s.seats && patchSession(s.id, { seats: Number(e.target.value) })}
                      inputMode="numeric"
                      aria-label={`Seats for ${s.date}`}
                    />
                    <button aria-label={`Delete session ${s.date}`} className="text-red-600 hover:text-red-700" onClick={() => removeSession(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {c.sessions.length === 0 && <p className="text-sm text-muted-foreground">No upcoming sessions, add one.</p>}
          </div>
        </div>
      ))}

      <div>
        <h2 className="mb-2 font-bold">All bookings</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5">Reference</th>
                <th className="px-3 py-2.5">Trainee</th>
                <th className="px-3 py-2.5">Course</th>
                <th className="px-3 py-2.5">Seats</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-teal-50/40">
                  <td className="px-3 py-2.5 font-mono text-xs">{b.reference}</td>
                  <td className="px-3 py-2.5">{b.customerName}<span className="block text-xs text-muted-foreground">{b.phone}</span></td>
                  <td className="px-3 py-2.5 text-xs">{b.courseTitle}</td>
                  <td className="px-3 py-2.5">{b.seats}</td>
                  <td className="px-3 py-2.5 font-bold">{ghs(b.total)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
              {data.bookings.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* add session dialog */}
      <Dialog open={!!addFor} onOpenChange={(v) => !v && setAddFor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-sm">
          <DialogHeader><DialogTitle>Add session, {addFor?.title}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label htmlFor="s-date">Date</Label><Input id="s-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            <div><Label htmlFor="s-time">Time</Label><Input id="s-time" value={form.timeText} onChange={(e) => setForm((f) => ({ ...f, timeText: e.target.value }))} /></div>
            <div>
              <Label htmlFor="s-loc">Location</Label>
              <Select value={form.location} onValueChange={(v) => setForm((f) => ({ ...f, location: v }))}>
                <SelectTrigger id="s-loc"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALS Farm, Akuse">ALS Farm, Akuse</SelectItem>
                  <SelectItem value="ALS Training Centre, Akuse">ALS Training Centre, Akuse</SelectItem>
                  <SelectItem value="Live online, link sent by email">Live online, link sent by email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="s-seats">Seats</Label><Input id="s-seats" inputMode="numeric" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} /></div>
            <Button onClick={addSession} disabled={!form.date} className="rounded-full">Add session</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* trainee list dialog (printable) */}
      <Dialog open={!!listFor} onOpenChange={(v) => !v && setListFor(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="no-print">
            <DialogTitle>Trainee list, print and take it to the gate</DialogTitle>
          </DialogHeader>
          {listFor && <TraineeList courseTitle={listFor.course.title} session={listFor.session} bookings={bookingsFor.get(listFor.session.id) ?? []} />}
          <div className="no-print">
            <Button className="w-full rounded-full" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" /> Print trainee list
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
