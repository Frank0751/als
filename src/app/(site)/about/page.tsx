import type { Metadata } from "next";
import AboutView from "@/components/als/views/about-view";

export const metadata: Metadata = {
  title: "About ALS",
  description: "How Aquatic Link Solutions started in Akuse, Eastern Region, our mission, values and team.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <AboutView />;
}
