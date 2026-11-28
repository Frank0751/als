import type { Metadata } from "next";
import FingerlingsView from "@/components/als/views/fingerlings-view";

export const metadata: Metadata = {
  title: "Tilapia fingerlings",
  description: "Tilapia fingerling sizes, stocking guidance for ponds and cages, current availability and how to send an order request on WhatsApp.",
  alternates: { canonical: "/fingerlings" },
};

export default function Page() {
  return <FingerlingsView />;
}
