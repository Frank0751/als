"use client";

// ALS Dashboard, one place to run the whole business

import { useCallback, useEffect, useState } from "react";
import { useStaff, useRoute, type StaffDTO } from "@/lib/als/store";
import { api } from "@/lib/als/api";
import { Logo } from "../ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Package, CalendarDays, GraduationCap, BarChart3, Users,
  Settings2, History, Mail, LogOut, ShieldCheck,
} from "lucide-react";
import OrdersTab from "./dashboard/orders-tab";
import ApplicationsTab from "./dashboard/applications-tab";
import ProductsTab from "./dashboard/products-tab";
import CalendarTab from "./dashboard/calendar-tab";
import TrainingTab from "./dashboard/training-tab";
import ReportsTab from "./dashboard/reports-tab";
import SettingsTab from "./dashboard/settings-tab";
import StaffTab from "./dashboard/staff-tab";
import AuditTab from "./dashboard/audit-tab";
import EmailsTab from "./dashboard/emails-tab";

type TabId = "applications" | "orders" | "products" | "calendar" | "training" | "reports" | "emails" | "settings" | "staff" | "audit";

const TABS: { id: TabId; label: string; icon: typeof ClipboardList; minRole: string }[] = [
  { id: "applications", label: "Training applications", icon: GraduationCap, minRole: "STAFF" },
  { id: "orders", label: "Orders & payments", icon: ClipboardList, minRole: "STAFF" },
  { id: "products", label: "Stock & prices", icon: Package, minRole: "MANAGER" },
  { id: "calendar", label: "Collection dates", icon: CalendarDays, minRole: "MANAGER" },
  { id: "training", label: "Training calendar", icon: GraduationCap, minRole: "STAFF" },
  { id: "reports", label: "Sales reports", icon: BarChart3, minRole: "STAFF" },
  { id: "emails", label: "Order emails", icon: Mail, minRole: "STAFF" },
  { id: "settings", label: "Content & areas", icon: Settings2, minRole: "MANAGER" },
  { id: "staff", label: "Staff logins", icon: Users, minRole: "OWNER" },
  { id: "audit", label: "Who changed what", icon: History, minRole: "MANAGER" },
];

const RANK: Record<string, number> = { STAFF: 1, MANAGER: 2, OWNER: 3 };

function LoginScreen() {
  const setStaff = useStaff((s) => s.setStaff);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api<{ staff: StaffDTO; token: string }>("/api/auth/admin", {
        method: "POST",
        body: { username, password },
      });
      setStaff(res.staff, res.token);
      toast({ title: `Welcome, ${res.staff.name}`, description: "You are signed in for 12 hours." });
    } catch (e) {
      toast({ title: "Sign-in failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded border bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-white"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-xl font-bold">ALS staff sign-in</h1>
            <p className="text-xs text-muted-foreground">Only ALS staff can run orders, payments and stock.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <div><Label htmlFor="d-user">Username</Label><Input id="d-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></div>
          <div><Label htmlFor="d-pass">Password</Label><Input id="d-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && void submit()} /></div>
          <Button onClick={submit} disabled={busy || !username || !password} className="rounded">{busy ? "Signing in…" : "Sign in"}</Button>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every change is recorded against your name.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { staff, token, setStaff } = useStaff();
  const { navigate } = useRoute();
  const [tab, setTab] = useState<TabId>("applications");
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/admin", { method: "POST", body: { logout: true } });
    } catch {
      /* best effort */
    }
    setStaff(null, null);
    navigate("home");
  }, [setStaff, navigate]);

  if (!staff || !token) return <LoginScreen />;

  const allowed = TABS.filter((t) => RANK[staff.role] >= RANK[t.minRole]);
  const active = allowed.find((t) => t.id === tab) ? tab : "applications";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ALS dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as <b>{staff.name}</b> ({staff.role.toLowerCase()}), every change you make is logged.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded" onClick={() => navigate("home")}>Back to store</Button>
          <Button variant="outline" className="rounded" onClick={logout}><LogOut className="h-4 w-4" aria-hidden="true" /> Sign out</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="no-print lg:sticky lg:top-20 lg:self-start" aria-label="Dashboard sections">
          <button className="mb-2 flex w-full items-center justify-between rounded border px-3 py-2.5 text-sm font-semibold lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen}>
            {TABS.find((t) => t.id === active)?.label}
            <span className="text-xs text-muted-foreground">{mobileOpen ? "hide" : "menu"}</span>
          </button>
          <ul className={cn("space-y-1", mobileOpen ? "block" : "hidden lg:block")}>
            {allowed.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => { setTab(t.id); setMobileOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-sm font-medium",
                    active === t.id ? "bg-teal-700 text-white" : "text-stone-700 hover:bg-teal-50"
                  )}
                >
                  <t.icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label={`${active} panel`}>
          {active === "applications" && <ApplicationsTab />}
          {active === "orders" && <OrdersTab />}
          {active === "products" && <ProductsTab />}
          {active === "calendar" && <CalendarTab />}
          {active === "training" && <TrainingTab />}
          {active === "reports" && <ReportsTab />}
          {active === "emails" && <EmailsTab />}
          {active === "settings" && <SettingsTab />}
          {active === "staff" && <StaffTab />}
          {active === "audit" && <AuditTab />}
        </section>
      </div>
    </div>
  );
}
