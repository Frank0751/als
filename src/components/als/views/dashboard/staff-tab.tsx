"use client";

// Staff logins, roles decide what each person can change (OWNER only)

import { useCallback, useEffect, useState } from "react";
import { useStaff } from "@/lib/als/store";
import type { StaffDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function StaffTab() {
  const { token, staff: me } = useStaff();
  const [staff, setStaff] = useState<StaffDTO[] | null>(null);
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ username: "", name: "", role: "STAFF", password: "" });
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api<{ staff: StaffDTO[]; active: { id: string; active: boolean }[] }>("/api/admin/staff", { token });
      setStaff(res.staff);
      setActiveMap(Object.fromEntries(res.active.map((a) => [a.id, a.active])));
    } catch (e) {
      toast({ title: "Could not load staff", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    try {
      await api("/api/admin/staff", { method: "POST", token, body: form });
      toast({ title: "Staff added", description: `${form.name} can now sign in with @${form.username}.` });
      setForm({ username: "", name: "", role: "STAFF", password: "" });
      void load();
    } catch (e) {
      toast({ title: "Could not add staff", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    try {
      await api("/api/admin/staff", { method: "PATCH", token, body: { id, ...body } });
      toast({ title: "Saved" });
      void load();
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  if (!staff) return <p className="text-sm text-muted-foreground">Loading staff…</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Owners can do everything. Managers cannot change staff logins or page content. Staff logins can confirm payments and update order stages only. Every change is recorded in “Who changed what”.
      </p>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2.5">Staff</th>
              <th className="px-3 py-2.5">Username</th>
              <th className="px-3 py-2.5">Role</th>
              <th className="px-3 py-2.5 text-center">Active</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-teal-50/40">
                <td className="px-3 py-2.5 font-semibold">{s.name}{s.id === me?.id && <Badge className="ml-1.5 bg-teal-100 text-teal-800 hover:bg-teal-100">you</Badge>}</td>
                <td className="px-3 py-2.5 font-mono text-xs">@{s.username}</td>
                <td className="px-3 py-2.5">
                  <Select value={s.role} onValueChange={(v) => patch(s.id, { role: v })}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2.5 text-center">{activeMap[s.id] ? <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">active</Badge> : <Badge className="bg-stone-200 text-stone-600 hover:bg-stone-200">disabled</Badge>}</td>
                <td className="px-3 py-2.5 text-right">
                  <button className="text-xs font-semibold text-teal-700 hover:underline" onClick={() => { setResetFor(s.id); setNewPass(""); }}>
                    Reset password
                  </button>
                  {resetFor === s.id && (
                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                      <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (8+)" className="h-8 w-40" />
                      <button
                        className="rounded bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white"
                        onClick={() => { void patch(s.id, { password: newPass }); setResetFor(null); }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-bold">Add a staff login</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="st-user">Username</Label><Input id="st-user" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></div>
          <div><Label htmlFor="st-name">Full name</Label><Input id="st-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div>
            <Label htmlFor="st-role">Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger id="st-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="st-pass">Password (8+ characters)</Label><Input id="st-pass" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
        </div>
        <Button onClick={add} disabled={!form.username || !form.name || !form.password} className="mt-3 rounded">Add staff</Button>
      </div>
    </div>
  );
}
