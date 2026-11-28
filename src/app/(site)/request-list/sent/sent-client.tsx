"use client";

import { useEffect, useState } from "react";
import ConfirmView from "@/components/als/views/confirm-view";
import { readStashedPhone } from "@/lib/als/routes";

// The phone used to look up the saved request comes from this tab's
// sessionStorage, never from the URL. Wait for it before showing the view.
export default function SentClient({ orderNumber }: { orderNumber: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  useEffect(() => setPhone(readStashedPhone()), []);
  if (phone === null) return null;
  return <ConfirmView orderNumber={orderNumber} initialPhone={phone} />;
}
