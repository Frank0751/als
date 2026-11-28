import type { Metadata } from "next";
import PoliciesView from "@/components/als/views/policies-view";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the Aquatic Link Solutions website and ordering through it.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <PoliciesView tab="terms" />;
}
