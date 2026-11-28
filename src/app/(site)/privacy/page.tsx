import type { Metadata } from "next";
import PoliciesView from "@/components/als/views/policies-view";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Aquatic Link Solutions collects, uses and protects personal information.",
  alternates: { canonical: "/privacy" },
};

export default function Page() {
  return <PoliciesView tab="privacy" />;
}
