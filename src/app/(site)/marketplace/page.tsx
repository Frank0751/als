import type { Metadata } from "next";
import MarketplaceView from "@/components/als/views/marketplace-view";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Nets, harvesting equipment and accessories for fish farmers, ordered on WhatsApp from Aquatic Link Solutions.",
  alternates: { canonical: "/marketplace" },
};

export default function Page() {
  return <MarketplaceView />;
}
