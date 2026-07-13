"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ClubEvent, Club } from "@/lib/types";
import { getEvent, rsvpEvent, type RsvpStatus } from "@/lib/api/events";
import { getClub } from "@/lib/api/clubs";
import { getClubEvents } from "@/lib/api/events";
import { defaultEventCoverStyle } from "@/lib/eventCover";
import { downloadEventIcs } from "@/lib/ics";
import RsvpFormModal from "./RsvpFormModal";

const FORMAT_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  "in-person": { icon: "location_on",  label: "In person",  color: "text-emerald-700", bg: "bg-emerald-50" },
  "online":    { icon: "videocam",     label: "Online",     color: "text-indigo-700",  bg: "bg-indigo-50"  },
  "hybrid":    { icon: "merge",        label: "Hybrid",     color: "text-amber-700",   bg: "bg-amber-50"   },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  eventId: string;
}

export default function EventDetailClient({ eventId }: Props) {
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | null>(null);
  const [count, setCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const attending = rsvpStatus === "ATTENDING";
  const waitlisted = rsvpStatus === "WAITLISTED";

  useEffect(() => {
    setLoading(true);
    getEvent(eventId)
      .then(async (ev) => {
        setEvent(ev);
        setRsvpStatus(ev.myRsvpStatus);
        setCount(ev.attendeeCount);
        const [clubData, related] = await Promise.all([
          getClub(ev.clubSlug),
          getClubEvents(ev.clubSlug),
        ]);
        setClub(clubData);
        setRelatedEvents(related.filter((e) => e.id !== ev.id));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading || !event) {
    return (
      <div className="flex-1 min-w-0 min-h-screen bg-surface-faint animate-pulse">
        <div className="w-full aspect-[5/2] md:aspect-[3/1] bg-surface-container" />
        <div className="bg-primary h-20" />
        <div className="p-gutter">
          <div className="h-8 bg-surface-container rounded w-2/3 mb-4" />
          <div className="h-4 bg-surface-container rounded mb-2" />
          <div className="h-4 bg-surface-container rounded w-3/4" />
        </div>
      </div>
    );
  }

  function toggleAttend() {
    if (!event) return;
    // Currently registered → cancel.
    if (rsvpStatus === "ATTENDING" || rsvpStatus === "WAITLISTED") {
      const wasAttending = rsvpStatus === "ATTENDING";
      setRsvpStatus("NOT_ATTENDING");
      if (wasAttending) setCount((c) => c - 1);
      rsvpEvent(event.id, "NOT_ATTENDING").catch(() => {
        setRsvpStatus(wasAttending ? "ATTENDING" : "WAITLISTED");
        if (wasAttending) setCount((c) => c + 1);
      });
      return;
    }
    // Not registered → collect form answers first if the event has any.
    if (event.questions.length > 0) {
      setShowForm(true);
      return;
    }
    rsvpEvent(event.id, "ATTENDING").then((status) => {
      setRsvpStatus(status);
      if (status === "ATTENDING") setCount((c) => c + 1);
    }).catch(() => {});
  }

  function onRsvpFormDone(status: RsvpStatus) {
    setShowForm(false);
    setRsvpStatus(status);
    if (status === "ATTENDING") setCount((c) => c + 1);
  }

  const facepile: Array<{ id: string; displayName: string; avatarUrl: string }> = [];

  const fmt = FORMAT_META[event.format] ?? FORMAT_META["in-person"];
  const isPast = new Date(event.endsAt) < new Date();

  return (
    <div className="flex-1 min-w-0 min-h-screen bg-surface-faint">
      {showForm && (
        <RsvpFormModal event={event} onClose={() => setShowForm(false)} onDone={onRsvpFormDone} />
      )}
      <div className="w-full aspect-[5/2] md:aspect-[3/1] overflow-hidden bg-surface-container">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" style={defaultEventCoverStyle(event.id)} />
        )}
      </div>

      <div className="bg-primary">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
          <div className="px-4 md:px-6 py-4 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Date</span>
            <span className="font-headline-md text-headline-md text-white leading-tight">
              {new Date(event.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="text-xs text-white/60">
              {new Date(event.startsAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
            </span>
          </div>

          <div className="px-4 md:px-6 py-4 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Time</span>
            <span className="font-headline-md text-headline-md text-white leading-tight">
              {fmtTime(event.startsAt)}
            </span>
            <span className="text-xs text-white/60">until {fmtTime(event.endsAt)}</span>
          </div>

          <div className="px-4 md:px-6 py-4 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Format</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-white text-[18px]">{fmt.icon}</span>
              <span className="font-headline-md text-headline-md text-white leading-tight">{fmt.label}</span>
            </div>
            <span className="text-xs text-white/60">{event.format === "online" ? "Join from anywhere" : event.format === "hybrid" ? "In-person + online" : "On campus"}</span>
          </div>

          <div className="px-4 md:px-6 py-4 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Location</span>
            <span className="font-headline-md text-headline-md text-white leading-tight truncate">
              {event.location.split(",")[0]}
            </span>
            <span className="text-xs text-white/60 truncate">{event.location.includes(",") ? event.location.split(",").slice(1).join(",").trim() : " "}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-gutter pt-gutter pb-2">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2 flex-wrap">
          <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/clubs/${club?.slug ?? event.clubSlug}`} className="hover:text-primary transition-colors">{club?.name ?? ""}</Link>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary leading-tight">
          {event.title}
        </h1>
        {isPast && (
          <span className="mt-2 inline-block bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
            Past event
          </span>
        )}
      </div>

      <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-gutter py-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

          <div className="lg:col-span-8 flex flex-col gap-gutter">

            <div className="bg-white border border-border-subtle rounded-xl p-gutter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-md">
                <div>
                  <p className="font-label-md text-on-surface-variant mb-stack-sm">
                    {count.toLocaleString()} {count === 1 ? "student" : "students"} attending
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {facepile.map((u) => (
                        <img
                          key={u.id}
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                        />
                      ))}
                    </div>
                    {count > 4 && (
                      <span className="text-label-sm text-on-surface-variant">+{count - 4} more</span>
                    )}
                  </div>
                </div>

                {/* RSVP buttons */}
                {!isPast ? (
                  <div className="flex gap-stack-sm flex-wrap items-center">
                    <button
                      onClick={toggleAttend}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg font-label-md text-label-md transition-all active:scale-95",
                        attending
                          ? "bg-primary text-white hover:opacity-90"
                          : waitlisted
                          ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          : "border-2 border-primary text-primary hover:bg-primary/5"
                      )}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={attending ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {attending ? "check_circle" : waitlisted ? "hourglass_top" : "add_circle"}
                      </span>
                      {attending ? "Going" : waitlisted ? "On waitlist" : "RSVP"}
                    </button>
                    {(attending || waitlisted) && (
                      <button
                        onClick={toggleAttend}
                        className="px-4 py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant border border-border-subtle hover:bg-surface-container transition-colors"
                      >
                        {waitlisted ? "Leave waitlist" : "Can't make it"}
                      </button>
                    )}
                    <button
                      onClick={() => downloadEventIcs(event)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant border border-border-subtle hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                      Add to calendar
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-on-surface-variant italic">This event has ended.</span>
                )}
              </div>
            </div>

            <div className="bg-white border border-border-subtle rounded-xl p-gutter">
              <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">About this event</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                {event.description}
              </p>

              <div className={cn("mt-gutter flex items-start gap-3 p-4 rounded-xl", fmt.bg)}>
                <span className={cn("material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5", fmt.color)}>
                  {fmt.icon}
                </span>
                <div>
                  <p className={cn("font-label-md text-label-md", fmt.color)}>{fmt.label} event</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {event.format === "in-person" && `Bring your student ID. Venue: ${event.location}.`}
                    {event.format === "online" && `Join link will be sent to members before the event. ${event.location}.`}
                    {event.format === "hybrid" && `Attend in person at ${event.location}, or join via the link sent to members.`}
                  </p>
                </div>
              </div>
            </div>

            {relatedEvents.length > 0 && (
              <div className="bg-white border border-border-subtle rounded-xl p-gutter">
                <div className="flex items-center justify-between mb-stack-md">
                  <h2 className="font-headline-md text-headline-md text-primary">More from {club?.name ?? ""}</h2>
                  <Link
                    href={`/clubs/${club?.slug ?? event.clubSlug}`}
                    className="text-action-blue font-label-md text-label-md hover:underline"
                  >
                    View club
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                  {relatedEvents.slice(0, 4).map((e) => (
                    <RelatedEventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-gutter lg:sticky lg:top-24">

            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div
                className="h-20 w-full"
                style={{
                  backgroundColor: "#001B3D",
                  backgroundImage: "radial-gradient(at 80% 0%, #2E5BFF22 0, transparent 60%)",
                }}
              />
              <div className="px-gutter pb-gutter -mt-8">
                <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center mb-stack-md">
                  <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-1">Organized by</p>
                <Link href={`/clubs/${club?.slug ?? event.clubSlug}`} className="font-headline-md text-headline-md text-primary hover:text-action-blue transition-colors block leading-tight">
                  {club?.name ?? ""}
                </Link>
                <p className="text-sm text-on-surface-variant mt-1">
                  {club?.memberCount.toLocaleString()} members · {club?.category}
                </p>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed line-clamp-3">
                  {club?.description}
                </p>
                <Link
                  href={`/clubs/${club?.slug ?? event.clubSlug}`}
                  className="mt-stack-md flex items-center justify-center gap-2 w-full py-2.5 border border-border-subtle rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  Visit club page
                </Link>
              </div>
            </div>

            <div className="bg-white border border-border-subtle rounded-xl p-gutter">
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-stack-md">Event details</h3>
              <div className="flex flex-col gap-stack-md">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-action-blue text-[20px] flex-shrink-0 mt-0.5">calendar_today</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{fmtDate(event.startsAt)}</p>
                    <p className="text-xs text-on-surface-variant">{fmtTime(event.startsAt)} – {fmtTime(event.endsAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-action-blue text-[20px] flex-shrink-0 mt-0.5">location_on</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{event.location}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{event.format} event</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-action-blue text-[20px] flex-shrink-0 mt-0.5">group</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{count} attending</p>
                    <p className="text-xs text-on-surface-variant">Open to all members</p>
                  </div>
                </div>
              </div>

              <div className="mt-gutter pt-stack-md border-t border-border-subtle flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-border-subtle rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-border-subtle rounded-lg text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                  Add to calendar
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

function RelatedEventCard({ event }: { event: ClubEvent }) {
  const isPast = new Date(event.endsAt) < new Date();
  return (
    <Link
      href={`/clubs/${event.clubSlug}/events/${event.id}`}
      className="flex gap-3 p-3 rounded-xl border border-border-subtle hover:shadow-sm transition-shadow bg-surface-faint group"
    >
      <div className="w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" style={defaultEventCoverStyle(event.id)} />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-label-md text-primary group-hover:text-action-blue transition-colors text-sm leading-tight line-clamp-2">
          {event.title}
        </p>
        <p className="text-[11px] text-on-surface-variant mt-1">
          {new Date(event.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {isPast && " · Past"}
        </p>
      </div>
    </Link>
  );
}