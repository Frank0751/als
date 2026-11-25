"use client";

// Who changed what, the audit trail (MANAGER+)

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { AuditDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { fmtDateTime } from "@/lib/als/format";
import { toast } from "@/hooks/use-toast";

export default function AuditTab() {
  const { token } = useStaff();
  const [rows, setRows] = useState<AuditDTO[] | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ audit: AuditDTO[] }>("/api/admin/audit", { token });
      setRows(res.audit);
    } catch (e) {
      toast({ title: "Could not load audit log", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!rows) return <p className="text-sm text-muted-foreground">Loading audit log…</p>;

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5">When</th>
            <th className="px-3 py-2.5">Who</th>
            <th className="px-3 py-2.5">Action</th>
            <th className="px-3 py-2.5">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-teal-50/40">
              <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">{fmtDateTime(r.createdAt)}</td>
              <td className="px-3 py-2.5 font-semibold">{r.actor}</td>
              <td className="px-3 py-2.5"><span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold">{r.action}</span></td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.detail}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">Nothing recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
