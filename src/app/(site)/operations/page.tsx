import type { Metadata } from "next";
import OperationsView from "@/components/als/views/operations-view";

export const metadata: Metadata = {
  title: "Our operations",
  description: "The ALS tilapia hatchery and fingerling production in Akuse, and cage grow-out on the Volta River.",
  alternates: { canonical: "/operations" },
};

export default function Page() {
  return <OperationsView />;
}
