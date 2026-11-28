import type { Metadata } from "next";
import ContactView from "@/components/als/views/contact-view";

export const metadata: Metadata = {
  title: "Contact",
  description: "Phone, WhatsApp, email and location of the Aquatic Link Solutions farm in Akuse, Eastern Region, Ghana.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactView />;
}
