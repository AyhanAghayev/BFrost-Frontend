"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClubEvent, EventFormat } from "@/lib/types";
import { getMyEventFeed, rsvpEvent } from "@/lib/api/events";
import { defaultEventCoverStyle } from "@/lib/eventCover";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

const FORMAT_META: Record<EventFormat, { label: string; cls: string }> = {
  "in-person": { label: "In person", cls: "bg-emerald-50 text-emerald-700" },
  online: { label: "Online", cls: "bg-blue-50 text-action-blue" },
  hybrid: { label: "Hybrid", cls: "bg-purple-50 text-purple-700" },
};

type ViewMode = "list" | "calendar";
type Filter = "all" | EventFormat;

const PAGE_SIZE = 9;

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function EventsPageClient() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [attending, setAttending] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    getMyEventFeed()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
        setEvents(sorted);
        setAttending(Object.fromEntries(sorted.map((e) => [e.id, e.isAttending])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const todayDate = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());

  async function toggleRsvp(id: string) {
    const wasAttending = !!attending[id];
    setAttending((p) => ({ ...p, [id]: !wasAttending }));
    try {
      await rsvpEvent(id, wasAttending ? "NOT_ATTENDING" : "ATTENDING");
    } catch {
      setAttending((p) => ({ ...p, [id]: wasAttending }));
    }
  }
  function effectiveCount(e: ClubEvent) {
    return e.attendeeCount + (attending[e.id] ? 1 : 0) - (e.isAttending ? 1 : 0);
  }
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  const days = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const eventDays = useMemo(() => {
    const set = new Set<number>();
    events.forEach((e) => {
      const d = new Date(e.startsAt);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) set.add(d.getDate());
    });
    return set;
  }, [events, calYear, calMonth]);

  const calEventMap = useMemo(() => {
    const map: Record<number, ClubEvent[]> = {};
    events.forEach((e) => {
      const d = new Date(e.startsAt);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        (map[day] ??= []).push(e);
      }
    });
    return map;
  }, [events, calYear, calMonth]);

  const [featured, ...rest] = events;
  const filteredRest = rest.filter((e) => filter === "all" || e.format === filter);
  const myRsvps = events.filter((e) => attending[e.id]);
  const totalPages = Math.max(1, Math.ceil(filteredRest.length / PAGE_SIZE));
  const pagedRest = filteredRest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex-1 min-w-0 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-body-sm">Loading events…</p>
        </div>
      </div>
    );}

  return (
    <div className="flex-1 min-w-0 flex gap-gutter px-margin-mobile md:px-gutter py-gutter">
      <div className="flex-1 min-w-0 flex flex-col gap-stack-lg">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-gutter">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">Events</h1>
            <p className="text-on-surface-variant text-body-sm mt-1">
              {events.length} upcoming events from your clubs
            </p>
          </div>
          <div className="flex bg-surface-container rounded-lg p-1 self-start sm:self-auto">
            {(["list", "calendar"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 rounded-md font-label-md text-label-md capitalize transition-colors",
                  view === v
                    ? "bg-white shadow-sm text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                )}
              >
                {v === "list" ? "List" : "Calendar"}
              </button>
            ))}
          </div>
        </div>

        {view !== "list" ? (
          <CalendarView
            days={days}
            calEventMap={calEventMap}
            calYear={calYear}
            calMonth={calMonth}
            onPrev={prevMonth}
            onNext={nextMonth}
            attending={attending}
          />
        ) : (
        <>
        {featured && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-7 relative rounded-xl overflow-hidden group h-[380px] border border-border-subtle">
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 z-10" />
              {featured.coverImageUrl ? (
                <img
                  src={featured.coverImageUrl}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0" style={defaultEventCoverStyle(featured.id)} />
              )}
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[#001b3d] font-bold text-center shadow-sm">
                <div className="text-[10px] uppercase tracking-wider leading-none">
                  {fmtMonth3(featured.startsAt)}
                </div>
                <div className="text-xl leading-snug">{fmtDayNum(featured.startsAt)}</div>
              </div>
              {isToday(featured.startsAt) && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-white text-primary px-3 py-1 rounded-full font-label-sm text-label-sm shadow-sm">
                    Happening today
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 p-gutter z-20 text-white max-w-xl [text-shadow:0_1px_4px_rgba(0,0,0,0.55)]">
                <div className="flex items-center gap-2 mb-stack-sm">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full font-label-sm text-label-sm [text-shadow:none]",
                      FORMAT_META[featured.format].cls
                    )}
                  >
                    {FORMAT_META[featured.format].label}
                  </span>
                  <span className="bg-white/90 backdrop-blur-sm text-[#001b3d] font-label-sm text-label-sm font-medium px-2.5 py-1 rounded-full [text-shadow:none]">
                    {featured.clubName}
                  </span>
                </div>
                <h2 className="font-headline-lg text-headline-lg mb-stack-sm">
                  {featured.title}
                </h2>
                <p className="text-body-sm text-white/80 mb-stack-md line-clamp-2">
                  {featured.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-stack-lg gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-white/70 text-[18px]">
                      schedule
                    </span>
                    <span className="font-label-md text-label-md">
                      {fmtTime(featured.startsAt)} – {fmtTime(featured.endsAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-white/70 text-[18px]">
                      location_on
                    </span>
                    <span className="font-label-md text-label-md">{featured.location}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-5 bg-white border border-border-subtle rounded-xl p-gutter flex flex-col gap-stack-lg">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-stack-sm">
                  Your RSVP
                </p>
                <h3 className="font-headline-md text-headline-md text-primary leading-tight">
                  {featured.title}
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                      FORMAT_META[featured.format].cls
                    )}>
                    <span className="material-symbols-outlined text-[15px]">
                      {featured.format === "online"
                        ? "videocam"
                        : featured.format === "hybrid"
                        ? "sensors"
                        : "location_on"}
                    </span>
                    {FORMAT_META[featured.format].label}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {featured.clubName}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-on-surface-variant text-body-sm">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">
                    schedule
                  </span>
                  <span>
                    {fmtTime(featured.startsAt)} – {fmtTime(featured.endsAt)}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-on-surface-variant text-body-sm">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">
                    pin_drop
                  </span>
                  <span>{featured.location}</span>
                </div>
              </div>
              <div className="bg-surface-faint border border-border-subtle rounded-xl p-stack-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm text-on-surface-variant">Attending</span>
                  <span className="font-label-md text-label-md text-primary">
                    {effectiveCount(featured)} going
                  </span>
                </div>
                <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-action-blue h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (effectiveCount(featured) / Math.ceil(featured.attendeeCount * 1.5)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-stack-sm mt-auto">
                <button
                  onClick={() => toggleRsvp(featured.id)}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-label-md text-label-md transition-all flex items-center justify-center gap-2",
                    attending[featured.id]
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-primary text-white hover:opacity-90"
                  )}>
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={attending[featured.id] ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {attending[featured.id] ? "check_circle" : "calendar_add_on"}
                  </span>
                  {attending[featured.id] ? "Going" : "Mark as going"}
                </button>
                <Link
                  href={`/clubs/${featured.clubSlug}/events/${featured.id}`}
                  className="w-full py-3 border border-border-subtle text-on-surface-variant rounded-xl font-label-md text-label-md hover:bg-surface-container transition-colors text-center">
                  View details
                </Link>
              </div>
            </div>
          </div>
        )}
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
              )}>
              {label}
            </button>
          ))}
          <span className="text-body-sm text-on-surface-variant ml-auto">
            {filteredRest.length} event{filteredRest.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {pagedRest.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              attending={attending[event.id]}
              count={effectiveCount(event)}
              onToggle={() => toggleRsvp(event.id)}
            />
          ))}
          {filteredRest.length === 0 && (
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
        {filteredRest.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pb-gutter">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-border-subtle text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-9 h-9 rounded-lg font-label-md text-label-md text-sm transition-colors",
                  p === page
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-border-subtle text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
        </>
        )}
      </div>
      <aside className="hidden xl:flex flex-col gap-gutter w-72 shrink-0">
        <div className="bg-white border border-border-subtle rounded-xl p-gutter">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-stack-md">
            Your schedule
          </h5>
          {myRsvps.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant py-4 text-center">No RSVPs yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {myRsvps.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-primary flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] text-white/60 font-bold uppercase leading-none">
                      {fmtMonth3(e.startsAt)}
                    </span>
                    <span className="text-sm font-bold text-white leading-none">
                      {fmtDayNum(e.startsAt)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-on-surface text-sm truncate">{e.title}</p>
                    <p className="text-body-sm text-on-surface-variant text-xs">
                      {fmtTime(e.startsAt)}
                    </p>
                  </div>
                  <span
                    className="material-symbols-outlined text-emerald-600 text-[18px] flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <MiniCalendar
          calYear={calYear}
          calMonth={calMonth}
          days={days}
          eventDays={eventDays}
          todayDate={todayDate}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      </aside>
    </div>
  );}

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

function MiniCalendar({
  calYear,
  calMonth,
  days,
  eventDays,
  todayDate,
  onPrev,
  onNext,
}: {
  calYear: number;
  calMonth: number;
  days: (number | null)[];
  eventDays: Set<number>;
  todayDate: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="bg-white border border-border-subtle rounded-xl p-gutter">
      <div className="flex items-center justify-between mb-gutter">
        <h5 className="font-label-md text-label-md text-on-surface">
          {MONTH_NAMES[calMonth]} {calYear}
        </h5>
        <div className="flex gap-1">
          <button onClick={onPrev} className="p-1 rounded hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-outline text-[20px]">chevron_left</span>
          </button>
          <button onClick={onNext} className="p-1 rounded hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-[10px] text-on-surface-variant font-bold uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map((d, i) => {
          if (d === null) return <div key={i} />;
          const today =
            d === todayDate.getDate() &&
            calYear === todayDate.getFullYear() &&
            calMonth === todayDate.getMonth();
          const hasEvent = eventDays.has(d);
          return (
            <div
              key={i}
              className={cn(
                "relative flex flex-col items-center py-1.5 rounded-lg cursor-pointer transition-colors text-sm",
                today ? "bg-primary text-white font-bold" : "hover:bg-surface-container text-on-surface"
              )}
            >
              {d}
              {hasEvent && (
                <span
                  className={cn(
                    "absolute bottom-0.5 w-1 h-1 rounded-full",
                    today ? "bg-white/60" : "bg-action-blue"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView({
  days,
  calEventMap,
  calYear,
  calMonth,
  onPrev,
  onNext,
  attending,
}: {
  days: (number | null)[];
  calEventMap: Record<number, ClubEvent[]>;
  calYear: number;
  calMonth: number;
  onPrev: () => void;
  onNext: () => void;
  attending: Record<string, boolean>;
}) {
  const todayRef = new Date();
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
        <h2 className="font-headline-md text-headline-md text-primary">
          {MONTH_NAMES[calMonth]} {calYear}
        </h2>
        <div className="flex gap-2">
          <button onClick={onPrev} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
          </button>
          <button onClick={onNext} className="p-2 rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border-subtle">
        {DOW.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[11px] font-bold uppercase tracking-wider text-on-surface-variant border-r last:border-r-0 border-border-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-border-subtle">
        {days.map((d, i) => {
          const today =
            d !== null &&
            d === todayRef.getDate() &&
            calYear === todayRef.getFullYear() &&
            calMonth === todayRef.getMonth();
          const dayEvents = d !== null ? (calEventMap[d] ?? []) : [];

          return (
            <div
              key={i}
              className={cn(
                "border-r border-b border-border-subtle p-2 min-h-[100px]",
                d === null ? "bg-surface-faint" : ""
              )}
            >
              {d !== null && (
                <>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1",
                      today ? "bg-primary text-white font-bold" : "text-on-surface"
                    )}
                  >
                    {d}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[11px] font-semibold truncate",
                          attending[e.id] ? "bg-emerald-100 text-emerald-800" : "bg-primary/10 text-primary"
                        )}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-on-surface-variant px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
