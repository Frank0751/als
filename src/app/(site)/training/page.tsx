import type { Metadata } from "next";
import TrainingView from "@/components/als/views/training-view";

export const metadata: Metadata = {
  title: "Free fish farming training",
  description: "Free tilapia farming training on the farm in Akuse or online through video lessons, with a focus on women and persons with disabilities.",
  alternates: { canonical: "/training" },
};

export default function Page() {
  return <TrainingView />;
}
