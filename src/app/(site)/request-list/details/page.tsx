import type { Metadata } from "next";
import RequestDetailsView from "@/components/als/views/checkout-view";

export const metadata: Metadata = {
  title: "Request details",
  description: "Add your name, phone and pickup or delivery preference, then send your order request on WhatsApp.",
  robots: { index: false },
};

export default function Page() {
  return <RequestDetailsView />;
}
