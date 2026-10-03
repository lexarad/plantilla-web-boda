"use client";

import { useState } from "react";
import { Apple, Calendar, CalendarPlus, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddToCalendarProps = {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  locale?: "es" | "ca";
};

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildGoogleUrl({ title, description, location, startIso, endIso }: AddToCalendarProps) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  url.searchParams.set("details", description);
  url.searchParams.set("location", location);
  url.searchParams.set("dates", `${formatIcsDate(startIso)}/${formatIcsDate(endIso)}`);
  return url.toString();
}

function buildOutlookUrl({ title, description, location, startIso, endIso }: AddToCalendarProps) {
  const url = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  url.searchParams.set("path", "/calendar/action/compose");
  url.searchParams.set("rru", "addevent");
  url.searchParams.set("startdt", startIso);
  url.searchParams.set("enddt", endIso);
  url.searchParams.set("subject", title);
  url.searchParams.set("body", description);
  url.searchParams.set("location", location);
  return url.toString();
}

function buildIcsContent({ title, description, location, startIso, endIso }: AddToCalendarProps) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Web de boda//ES",
    "BEGIN:VEVENT",
    `UID:boda-${Date.now()}@web-de-boda`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(startIso)}`,
    `DTEND:${formatIcsDate(endIso)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

function downloadIcs(props: AddToCalendarProps) {
  const blob = new Blob([buildIcsContent(props)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "boda.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AddToCalendar(props: AddToCalendarProps) {
  const { locale = "es" } = props;
  const [open, setOpen] = useState(false);

  const labels = locale === "ca"
    ? { main: "Afegir al calendari", google: "Google Calendar", outlook: "Outlook", apple: "Apple Calendar (.ics)" }
    : { main: "Añadir al calendario", google: "Google Calendar", outlook: "Outlook", apple: "Apple Calendar (.ics)" };

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <CalendarPlus className="size-4" />
        {labels.main}
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-panel"
          >
            <a
              role="menuitem"
              href={buildGoogleUrl(props)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-primary/5"
              onClick={() => setOpen(false)}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="size-4" />
              </span>
              {labels.google}
            </a>
            <a
              role="menuitem"
              href={buildOutlookUrl(props)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-primary/5"
              onClick={() => setOpen(false)}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-4" />
              </span>
              {labels.outlook}
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                downloadIcs(props);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-primary/5"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Apple className="size-4" />
              </span>
              {labels.apple}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
