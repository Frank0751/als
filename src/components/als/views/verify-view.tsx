"use client";

// Verify receipt, public page so an ALS receipt cannot be faked

import { useEffect, useState } from "react";
import { useRoute } from "@/lib/als/store";
import { fmtDateTime, ghs, statusLabel } from "@/lib/als/format";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldAlert } from "lucide-react";

type VerifyResult =
  | { valid: true; orderNumber: string; issuedTo: string; total: number; status: string; issuedAt: string }
  | { valid: false; message: string };

export default function VerifyView({ code: initialCode }: { code: string }) {
  const { navigate } = useRoute();
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (c: string) => {
    if (!c.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await api<VerifyResult>(`/api/receipts/${encodeURIComponent(c.trim().toUpperCase())}`);
      setResult(res);
    } catch (e) {
      setResult({ valid: false, message: e instanceof Error ? e.message : "Could not check that code." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialCode) void check(initialCode);
     
  }, [initialCode]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-16">
      <div className="rounded-2xl border-2 border-teal-600 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-white"><BadgeCheck className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-xl font-bold">Verify a receipt</h1>
            <p className="text-xs text-muted-foreground">Every genuine ALS receipt carries a code. Check it here in seconds.</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ALS-4F9C2A-77"
            className="font-mono"
            aria-label="Receipt code"
            onKeyDown={(e) => e.key === "Enter" && void check(code)}
          />
          <Button onClick={() => void check(code)} disabled={busy} className="rounded-full">{busy ? "Checking…" : "Verify"}</Button>
        </div>

        {result && (
          <div className="mt-5">
            {result.valid ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 font-bold text-emerald-800"><BadgeCheck className="h-5 w-5" aria-hidden="true" /> This receipt is genuine</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-emerald-900/70">Receipt code</dt><dd className="text-right font-mono font-semibold">{code}</dd>
                  <dt className="text-emerald-900/70">Order</dt><dd className="text-right font-semibold">{result.orderNumber}</dd>
                  <dt className="text-emerald-900/70">Issued to</dt><dd className="text-right font-semibold">{result.issuedTo}</dd>
                  <dt className="text-emerald-900/70">Amount</dt><dd className="text-right font-semibold">{ghs(result.total)}</dd>
                  <dt className="text-emerald-900/70">Order status</dt><dd className="text-right font-semibold">{statusLabel(result.status)}</dd>
                  <dt className="text-emerald-900/70">Issued on</dt><dd className="text-right">{fmtDateTime(result.issuedAt)}</dd>
                </dl>
              </div>
            ) : (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4">
                <p className="flex items-center gap-2 font-bold text-red-800"><ShieldAlert className="h-5 w-5" aria-hidden="true" /> Not a valid receipt code</p>
                <p className="mt-1 text-sm text-red-700">{result.message || "No receipt found with that code. Do not accept this receipt as proof of payment."}</p>
              </div>
            )}
          </div>
        )}

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          ALS issues receipts only after confirming payment in its dashboard. If someone shows you a receipt without a code, or a code that fails here, do not treat it as proof of payment, report it to ALS on WhatsApp.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => navigate("contact")}>Report a fake receipt</Button>
          <Badge variant="outline" className="self-center border-teal-200 bg-teal-50 text-teal-800">Protected by the ALS platform</Badge>
        </div>
      </div>
    </div>
  );
}
