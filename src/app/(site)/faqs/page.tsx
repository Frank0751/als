import type { Metadata } from "next";
import FaqsView from "@/components/als/views/faqs-view";

export const metadata: Metadata = {
  title: "Questions and answers",
  description: "Answers to common questions about ALS fingerlings, training and ordering.",
  alternates: { canonical: "/faqs" },
};

export default function Page() {
  return <FaqsView />;
}
