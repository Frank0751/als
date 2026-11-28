import type { Metadata } from "next";
import ApplyView from "@/components/als/views/apply-view";

export const metadata: Metadata = {
  title: "Apply to train, free",
  description: "Apply for free fish farming training with Aquatic Link Solutions, on the farm or online.",
  alternates: { canonical: "/training/apply" },
};

export default function Page() {
  return <ApplyView />;
}
