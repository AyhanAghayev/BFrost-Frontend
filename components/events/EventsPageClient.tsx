"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClubEvent, EventFormat } from "@/lib/types";
import { defaultEventCoverStyle } from "@/lib/eventCover";

function fmtMonth3(iso: string) {
  return new Date(iso).toLocaleString("en", { month: "short" });
}
function fmtDayNum(iso: string) {
  return new Date(iso).getDate();
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const FORMAT_META: Record<EventFormat, { label: string; cls: string }> = {
  "in-person": { label: "In person", cls: "bg-emerald-50 text-emerald-700" },
  online: { label: "Online", cls: "bg-blue-50 text-action-blue" },
  hybrid: { label: "Hybrid", cls: "bg-purple-50 text-purple-700" },
};

type Filter = "all" | EventFormat;

interface EventsPageClientProps {
  initialEvents: ClubEvent[];
}

export default function EventsPageClient({ initialEvents }: EventsPageClientProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [attending, setAttending] = useState<Record<string, boolean>>(
    Object.fromEntries(initialEvents.map((e) => [e.id, e.isAttending]))
  );

  function toggleRsvp(id: string) {
    setAttending((p) => ({ ...p, [id]: !p[id] }));
  }
  function effectiveCount(e: ClubEvent) {
    return e.attendeeCount + (attending[e.id] ? 1 : 0) - (e.isAttending ? 1 : 0);
  }

  const filtered = initialEvents.filter((e) => filter === "all" || e.format === filter);

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-stack-lg px-margin-mobile md:px-gutter py-gutter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-gutter">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Events</h1>
          <p className="text-on-surface-variant text-body-sm mt-1">
            {initialEvents.length} upcoming events from your clubs
          </p>
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex items-center gap-stack-sm flex-wrap">
        {(
          [
            { val: "all", label: "All" },
            { val: "in-person", label: "In person" },
            { val: "online", label: "Online" },
            { val: "hybrid", label: "Hybrid" },
          ] as { val: Filter; label: string }[]
        ).map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn(
              "px-4 py-2 rounded-full font-label-md text-label-md border transition-all",
              filter === val
                ? "bg-primary text-white border-primary"
                : "bg-white text-on-surface-variant border-border-subtle hover:border-primary hover:text-primary"
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-body-sm text-on-surface-variant ml-auto">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter pb-gutter">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            attending={attending[event.id]}
            count={effectiveCount(event)}
            onToggle={() => toggleRsvp(event.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[40px] opacity-30">
              event_busy
            </span>
            <p className="text-on-surface-variant text-body-sm">
              No {filter === "all" ? "" : filter + " "}events right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  attending,
  count,
  onToggle,
}: {
  event: ClubEvent;
  attending: boolean;
  count: number;
  onToggle: () => void;
}) {
  const fmt = FORMAT_META[event.format];
  return (
    <div className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="h-44 relative overflow-hidden group">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={defaultEventCoverStyle(event.id)}>
            <span className="material-symbols-outlined text-[48px] text-white/40">
              event
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[#001b3d] font-bold text-center shadow-sm">
          <div className="text-[9px] uppercase tracking-wider leading-none">
            {fmtMonth3(event.startsAt)}
          </div>
          <div className="text-base leading-tight">{fmtDayNum(event.startsAt)}</div>
        </div>

        <div className="absolute top-3 right-3">
          <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", fmt.cls)}>
            {fmt.label}
          </span>
        </div>
      </div>

      <div className="p-gutter flex-1 flex flex-col">
        <span className="text-on-surface-variant text-xs font-semibold mb-1">{event.clubName}</span>
        <h4 className="font-headline-md text-[18px] text-primary mb-stack-sm leading-snug line-clamp-2">
          {event.title}
        </h4>
        <div className="flex flex-col gap-1.5 mb-gutter text-on-surface-variant text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{fmtTime(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>{count} attending</span>
          </div>
        </div>

        <div className="mt-auto pt-gutter border-t border-border-subtle flex items-center justify-between gap-2">
          <Link
            href={`/clubs/${event.clubSlug}/events/${event.id}`}
            className="text-action-blue font-label-md text-label-md text-sm hover:underline"
          >
            Details
          </Link>
          <button
            onClick={onToggle}
            className={cn(
              "px-4 py-2 rounded-lg font-label-md text-label-md text-sm transition-all",
              attending
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-error hover:border-red-200"
                : "bg-primary text-white hover:opacity-90"
            )}
          >
            {attending ? "Going" : "RSVP"}
          </button>
        </div>
      </div>
    </div>
  );
}
