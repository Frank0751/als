import type { Metadata } from "next";
import DashboardView from "@/components/als/views/dashboard-view";

export const metadata: Metadata = {
  title: "Staff portal",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DashboardView />;
}
