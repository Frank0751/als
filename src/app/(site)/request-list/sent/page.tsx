import type { Metadata } from "next";
import SentClient from "./sent-client";

export const metadata: Metadata = {
  title: "Request saved",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  return <SentClient orderNumber={order} />;
}
