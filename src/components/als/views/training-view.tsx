"use client";

// Training — courses, ALS booking calendar with open dates and seats left

import { useState } from "react";
import { useCatalog } from "../catalog-context";
import { useCart, navigate } from "@/lib/als/store";
import type { CourseDTO, SessionDTO } from "@/lib/als/types";
import { ProductImage, SectionTitle } from "../ui-bits";
import { fmtDate, ghs } from "@/lib/als/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Clock3, MapPin, Users, Wifi } from "lucide-react";

function typeLabel(t: string): string {
  switch (t) {
    case "ON_FARM": return "On-farm practical";
    case "SEMINAR": return "Seminar";
    case "WORKSHOP": return "Workshop";
    case "ONLINE": return "Live online";
    default: return t;
  }
}

function seatsLeft(s: SessionDTO) {
  return Math.max(0, s.seats - s.booked);
}

function CourseCard({ course }: { course: CourseDTO }) {
  const add = useCart((s) => s.add);
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [confirming, setConfirming] = useState(false);

  const book = () => {
    if (!session) return;
    const left = seatsLeft(session);
    if (left <= 0) {
      toast({ title: "That date is full", description: "Pick another open date — ALS closes dates automatically when they are full.", variant: "destructive" });
      return;
    }
    add({
      kind: "TRAINING",
      refId: course.id,
      name: course.title,
      variant: `${session.date} · ${session.timeText}`,
      qty: 1,
      unit: "seat",
      unitPrice: course.fee,
      sessionId: session.id,
      date: session.date,
      maxQty: left,
    });
    setSession(null);
    setConfirming(false);
    toast({ title: "Added to cart", description: `${course.title} — ${fmtDate(session.date)}` });
  };

  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      <div className="relative">
        <ProductImage src={course.imageUrl} alt={course.title} kind="TRAINING" className="h-44 w-full" />
        <span className="absolute left-3 top-3"><Badge className="bg-teal-700 text-white hover:bg-teal-700">{typeLabel(course.type)}</Badge></span>
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{course.durationText}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What it covers</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {course.covers.map((c) => (
              <li key={c} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />{c}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-xl border bg-stone-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-teal-700" aria-hidden="true" /> Booking calendar — pick an open date</p>
          {course.sessions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">New dates are being planned. Ask ALS on WhatsApp.</p>
          ) : (
            <div className="mt-2 grid gap-2">
              {course.sessions.map((s) => {
                const left = seatsLeft(s);
                const full = left <= 0;
                return (
                  <button
                    key={s.id}
                    disabled={full}
                    onClick={() => setSession(s)}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${full ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400" : "border-teal-200 bg-white hover:border-teal-600"}`}
                  >
                    <span className="font-semibold">{fmtDate(s.date)}</span>
                    <span className="text-xs text-muted-foreground">{s.timeText}</span>
                    {full ? (
                      <Badge variant="outline" className="border-stone-300 text-stone-400">Full — closed</Badge>
                    ) : (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><Users className="mr-1 h-3 w-3" aria-hidden="true" />{left} seat{left === 1 ? "" : "s"} left</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-extrabold text-teal-800">{ghs(course.fee)}<span className="text-xs font-medium text-muted-foreground"> /seat</span></p>
          <span className="text-xs text-muted-foreground">Receipt = admission slip</span>
        </div>
      </CardContent>

      <Dialog open={!!session} onOpenChange={(v) => !v && setSession(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Book your seat</DialogTitle>
            <DialogDescription>{course.title}</DialogDescription>
          </DialogHeader>
          {session && (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-teal-700" aria-hidden="true" /> {fmtDate(session.date)}</p>
              <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-teal-700" aria-hidden="true" /> {session.timeText}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" /> {session.location}</p>
              {course.type === "ONLINE" && (
                <p className="flex items-center gap-2 text-teal-800"><Wifi className="h-4 w-4" aria-hidden="true" /> Joining link and materials arrive by email once ALS confirms payment.</p>
              )}
              <p className="flex items-center gap-2"><Users className="h-4 w-4 text-teal-700" aria-hidden="true" /> {seatsLeft(session)} seat(s) left — dates close automatically when full.</p>
              <p className="pt-1 text-lg font-extrabold text-teal-800">{ghs(course.fee)}</p>
            </div>
          )}
          <DialogFooter>
            {!confirming ? (
              <Button className="w-full rounded-full" onClick={() => setConfirming(true)}>Add booking to cart</Button>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <Button onClick={book} className="w-full rounded-full">Confirm — add to cart</Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>Back</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function TrainingView() {
  const { catalog } = useCatalog();
  if (!catalog) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <SectionTitle
        eyebrow="Train with ALS · Akuse & online"
        title="Anybody can train with ALS — booking is easy for a complete beginner"
        sub="On-farm practical training, seminars, workshops and live online courses. Book online and confirm on WhatsApp. Your receipt doubles as an admission slip with a code ALS checks at the gate."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {catalog.courses.map((c) => <CourseCard key={c.id} course={c} />)}
      </div>
      <div className="mt-8 rounded-2xl border bg-white p-6 text-center">
        <p className="font-bold">Training a group or cooperative?</p>
        <p className="mt-1 text-sm text-muted-foreground">ALS runs private sessions for groups of 8 or more — ask us for a date that suits you.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate("contact")}>Ask about group training</Button>
      </div>
    </div>
  );
}
