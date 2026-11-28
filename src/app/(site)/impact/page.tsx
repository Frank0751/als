import type { Metadata } from "next";
import ImpactView from "@/components/als/views/impact-view";

export const metadata: Metadata = {
  title: "Impact",
  description: "Who Aquatic Link Solutions serves and progress toward training 1,000 people in four years.",
  alternates: { canonical: "/impact" },
};

export default function Page() {
  return <ImpactView />;
}
