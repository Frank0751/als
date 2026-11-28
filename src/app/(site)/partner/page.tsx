import type { Metadata } from "next";
import PartnerView from "@/components/als/views/partner-view";

export const metadata: Metadata = {
  title: "Partner and invest",
  description: "Partnership and investment with Aquatic Link Solutions: investors, development partners, NGOs, buyers and research institutions.",
  alternates: { canonical: "/partner" },
};

export default function Page() {
  return <PartnerView />;
}
