"use client";

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

const labels = {
  es: { title: "Guárdalo en tu calendario:", ics: "Apple / otros (.ics)" },
  ca: { title: "Desa-ho al teu calendari:", ics: "Apple / altres (.ics)" }
} as const;

/** Tres enlaces simples: Google, Outlook y archivo .ics para el resto. */
export function AddToCalendar(props: AddToCalendarProps) {
  const t = labels[props.locale ?? "es"];
  const enlace = "text-primary underline underline-offset-4 hover:no-underline";

  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-muted-foreground">{t.title}</span>
      <a href={buildGoogleUrl(props)} target="_blank" rel="noreferrer" className={enlace}>
        Google Calendar
      </a>
      <a href={buildOutlookUrl(props)} target="_blank" rel="noreferrer" className={enlace}>
        Outlook
      </a>
      <button type="button" onClick={() => downloadIcs(props)} className={enlace}>
        {t.ics}
      </button>
    </p>
  );
}
