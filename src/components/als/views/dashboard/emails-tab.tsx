"use client";

// Order emails — every email the platform sent, at every stage (simulated store of outbound mail)

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { EmailDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { fmtDateTime } from "@/lib/als/format";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const KIND_LABEL: Record<string, string> = {
  ORDER_STAGE: "Order stage",
  RECEIPT: "Receipt",
  BOOKING: "Booking",
  ONLINE_COURSE: "Online course link",
};

export default function EmailsTab() {
  const { token } = useStaff();
  const [emails, setEmails] = useState<EmailDTO[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ emails: EmailDTO[] }>("/api/admin/emails", { token });
      setEmails(res.emails);
    } catch (e) {
      toast({ title: "Could not load emails", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!emails) return <p className="text-sm text-muted-foreground">Loading emails…</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Every order stage sends an email to the customer and to ALS. In production these deliver through Resend; here you see exactly what customers receive.
      </p>
      {emails.map((e) => (
        <div key={e.id} className="rounded-xl border bg-white">
          <button className="flex w-full flex-wrap items-center justify-between gap-2 p-3.5 text-left" onClick={() => setOpen(open === e.id ? null : e.id)} aria-expanded={open === e.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{e.subject}</p>
              <p className="text-xs text-muted-foreground">to {e.toEmail} · {fmtDateTime(e.createdAt)}</p>
            </div>
            <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">{KIND_LABEL[e.kind] ?? e.kind}</Badge>
          </button>
          {open === e.id && (
            <pre className="whitespace-pre-wrap border-t bg-stone-50 p-4 text-xs leading-relaxed">{e.body}</pre>
          )}
        </div>
      ))}
      {emails.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No emails sent yet.</p>}
    </div>
  );
}
