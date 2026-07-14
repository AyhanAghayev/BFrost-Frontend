import type { ClubEvent } from "@/lib/types";

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildEventIcs(event: ClubEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BFrost//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@bfrost`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startsAt)}`,
    `DTEND:${toIcsDate(event.endsAt)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "",
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.filter(Boolean).join("\r\n");
}

// Trigger a browser download of the event's .ics file.
export function downloadEventIcs(event: ClubEvent): void {
  const blob = new Blob([buildEventIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
