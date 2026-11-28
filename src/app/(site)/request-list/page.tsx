import type { Metadata } from "next";
import RequestListView from "@/components/als/views/cart-view";

export const metadata: Metadata = {
  title: "Your request list",
  description: "Items you plan to order from Aquatic Link Solutions on WhatsApp.",
  robots: { index: false },
};

export default function Page() {
  return <RequestListView />;
}
