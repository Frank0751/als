import type { Metadata } from "next";
import PoliciesView from "@/components/als/views/policies-view";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description: "What the Aquatic Link Solutions website does for accessibility and how to report a problem.",
  alternates: { canonical: "/accessibility" },
};

export default function Page() {
  return <PoliciesView tab="accessibility" />;
}
