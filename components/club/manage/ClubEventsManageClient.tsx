"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { defaultEventCoverStyle } from "@/lib/eventCover";
import type { Club, ClubEvent, EventFormat } from "@/lib/types";
import { getClub } from "@/lib/api/clubs";
import { uploadImage } from "@/lib/api/upload";
import {
  getClubEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendees,
  type EventAttendee,
} from "@/lib/api/events";
import { useAuthStore } from "@/lib/stores/auth.store";

interface Props {
  club: Club;
  events: ClubEvent[];
  currentUserId: string;
}

export default function ClubEventsManageClient({ slug }: { slug: string }) {
  const [club, setClub] = useState<Club | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    Promise.all([getClub(slug), getClubEvents(slug, true)])
      .then(([c, evs]) => { setClub(c); setEvents(evs); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <div className="animate-pulse space-y-stack-md">
          <div className="h-4 bg-surface-container-high rounded w-1/4" />
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-48 bg-surface-container-high rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">{error ?? "Club not found"}</p>
      </div>
    );
  }

  if (club.currentUserRole !== "owner" && club.currentUserRole !== "moderator") {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">You don&apos;t have permission to manage this club.</p>
      </div>
    );
  }

  return <ManageForm club={club} events={events} currentUserId={currentUser?.id ?? ""} />;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FORMAT_META: Record<EventFormat, { label: string; cls: string; icon: string }> = {
  "in-person": { label: "In person", cls: "bg-emerald-50 text-emerald-700", icon: "location_on" },
  online: { label: "Online", cls: "bg-blue-50 text-action-blue", icon: "videocam" },
  hybrid: { label: "Hybrid", cls: "bg-purple-50 text-purple-700", icon: "sensors" },
};

// ── Main component ────────────────────────────────────────────────────────────

function ManageForm({ club, events, currentUserId }: Props) {
  return null;
}
