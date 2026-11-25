"use client";

// Applications tab: review free-training applications, change status, WhatsApp one click

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStaff } from "@/lib/als/store";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { waLink } from "@/lib/als/format";
import { Spinner } from "../../ui-bits";

export type ApplicationDTO = {
  id: string; ref: string; fullName: string; phone: string; email: string | null;
  gender: string; ageRange: string; region: string; town: string; experience: string;
  format: string; source: string | null; disability: string | null; consent: boolean;
  status: string; notes: string | null; createdAt: string;
};

export const APPLICATION_STATUSES: { value: string; label: string }[] = [
  { value: "RECEIVED", label: "Received" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "ACCEPTED_FARM", label: "Accepted (on-farm)" },
  { value: "ACCEPTED_ONLINE", label: "Accepted (online)" },
  { value: "WAITLISTED", label: "Waitlisted" },
  { value: "NOT_ACCEPTED", label: "Not accepted" },
];

export function applicationStatusColor(s: string): string {
  switch (s) {
    case "RECEIVED": return "bg-stone-100 text-stone-700 border-stone-200";
    case "UNDER_REVIEW": return "bg-amber-50 text-amber-800 border-amber-200";
    case "ACCEPTED_FARM": return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "ACCEPTED_ONLINE": return "bg-teal-50 text-teal-800 border-teal-200";
    case "WAITLISTED": return "bg-orange-50 text-orange-800 border-orange-200";
    case "NOT_ACCEPTED": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-stone-100 text-stone-700 border-stone-200";
  }
}

export default function ApplicationsTab() {
  const token = useStaff((s) => s.token);
  const [apps, setApps] = useState<ApplicationDTO[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const d = await api<{ applications: ApplicationDTO[] }>("/api/applications", { token });
      setApps(d.applications);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
      setApps([]);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const regions = useMemo(() => Array.from(new Set((apps ?? []).map((a) => a.region))).sort(), [apps]);

  const filtered = useMemo(() => (apps ?? []).filter((a) =>
    (statusFilter === "ALL" || a.status === statusFilter) &&
    (regionFilter === "ALL" || a.region === regionFilter) &&
    (formatFilter === "ALL" || a.format === formatFilter)
  ), [apps, statusFilter, regionFilter, formatFilter]);

  async function save(a: ApplicationDTO, patch: { status?: string; notes?: string }) {
    setBusy(true);
    try {
      await api("/api/applications", { method: "PATCH", token, body: { id: a.id, ...patch } });
      setApps((prev) => (prev ?? []).map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
      toast({ title: `Application ${a.ref} updated` });
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function csv() {
    const rows = [["ref", "name", "phone", "email", "gender", "age", "region", "town", "experience", "format", "status", "applied"], ...(apps ?? []).map((a) => [a.ref, a.fullName, a.phone, a.email ?? "", a.gender, a.ageRange, a.region, a.town, a.experience, a.format, a.status, a.createdAt.slice(0, 10)])];
    const text = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "als-training-applications.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (apps === null) return <Spinner label="Loading applications…" />;
  if (error) return <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-left text-xl font-bold">Training applications</h2>
          <p className="tnum text-sm text-muted-foreground">{apps.length} received in total, {filtered.length} shown</p>
        </div>
        <Button variant="outline" className="rounded" onClick={csv} disabled={apps.length === 0}>Export CSV</Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="f-status">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="f-status" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {APPLICATION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-region">Region</Label>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger id="f-region" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All regions</SelectItem>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-format">Format</Label>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger id="f-format" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All formats</SelectItem>
              <SelectItem value="On the farm">On the farm</SelectItem>
              <SelectItem value="Online videos">Online videos</SelectItem>
              <SelectItem value="Either works for me">Either</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded border bg-[#FDFCF8] p-6 text-center text-sm text-muted-foreground">
          No applications match these filters yet. New applications from the public form appear here automatically.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((a) => {
            const status = APPLICATION_STATUSES.find((s) => s.value === a.status)?.label ?? a.status;
            const isOpen = open === a.id;
            return (
              <li key={a.id} className="rounded border bg-[#FDFCF8]">
                <button className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left" onClick={() => { setOpen(isOpen ? null : a.id); setNotes(a.notes ?? ""); }} aria-expanded={isOpen}>
                  <span className="text-sm font-semibold">
                    <span className="tnum">{a.ref}</span> · {a.fullName}
                    <span className="ml-2 font-normal text-muted-foreground">{a.region}, {a.town}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${applicationStatusColor(a.status)}`}>{status}</span>
                    <span className="tnum text-xs text-muted-foreground">{a.createdAt.slice(0, 10)}</span>
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t px-4 py-4">
                    <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                      <div><dt className="inline font-medium">Phone: </dt><dd className="inline">{a.phone}</dd></div>
                      <div><dt className="inline font-medium">Email: </dt><dd className="inline">{a.email ?? "not given"}</dd></div>
                      <div><dt className="inline font-medium">Gender: </dt><dd className="inline">{a.gender}</dd></div>
                      <div><dt className="inline font-medium">Age: </dt><dd className="inline">{a.ageRange}</dd></div>
                      <div><dt className="inline font-medium">Experience: </dt><dd className="inline">{a.experience}</dd></div>
                      <div><dt className="inline font-medium">Format: </dt><dd className="inline">{a.format}</dd></div>
                      <div><dt className="inline font-medium">Heard via: </dt><dd className="inline">{a.source ?? "not given"}</dd></div>
                      <div className="sm:col-span-2">
                        <dt className="inline font-medium">Access needs: </dt>
                        <dd className="inline">{a.disability ?? "not shared"}</dd>
                        <p className="mt-1 text-xs text-muted-foreground">Voluntary answers, visible only to owner and trainer roles.</p>
                      </div>
                    </dl>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`st-${a.id}`}>Status</Label>
                        <Select value={a.status} onValueChange={(v) => void save(a, { status: v })}>
                          <SelectTrigger id={`st-${a.id}`} className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {APPLICATION_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`nt-${a.id}`}>Internal note</Label>
                        <Textarea id={`nt-${a.id}`} rows={2} value={isOpen ? notes : a.notes ?? ""} onChange={(e) => setNotes(e.target.value)} onBlur={() => { if (notes !== (a.notes ?? "")) void save(a, { notes }); }} placeholder="Visible to ALS staff only" />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded wa-green text-white hover:bg-[#1fbe5a]"
                        onClick={() => {
                          const msg = `Hello ${a.fullName.split(" ")[0]}, this is Aquatic Link Solutions about your training application ${a.ref}. ${a.status === "ACCEPTED_FARM" ? "We are happy to invite you to the on-farm training at Akuse." : a.status === "ACCEPTED_ONLINE" ? "Good news, you are accepted for the online video training. We will send your sign-in details." : "We would like to talk about your application."}`;
                          window.open(waLink(a.phone, msg), "_blank");
                        }}
                      >
                        WhatsApp applicant
                      </Button>
                      <Button size="sm" variant="outline" className="rounded" onClick={() => void save(a, { status: a.status })} disabled={busy}>Save</Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
