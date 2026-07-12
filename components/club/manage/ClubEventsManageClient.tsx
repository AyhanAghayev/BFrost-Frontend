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

// ── CreateEventModal ──────────────────────────────────────────────────────────

interface CreateForm {
  title: string;
  format: EventFormat;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  description: string;
  coverImageUrl: string;
}

const emptyForm = (): CreateForm => ({
  title: "",
  format: "in-person",
  location: "",
  startsAt: "",
  endsAt: "",
  capacity: "",
  description: "",
  coverImageUrl: "",
});

const inputCls =
  "w-full bg-surface-faint border border-border-subtle rounded-xl px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-action-blue placeholder:text-on-surface-variant/60";

function eventToForm(e: ClubEvent): CreateForm {
  return {
    title: e.title,
    format: e.format,
    location: e.location,
    startsAt: toDatetimeLocal(e.startsAt),
    endsAt: toDatetimeLocal(e.endsAt),
    capacity: e.maxMembers != null ? String(e.maxMembers) : "",
    description: e.description,
    coverImageUrl: e.coverImageUrl ?? "",
  };
}

function CreateEventModal({
  clubId,
  clubName,
  currentUserId,
  event,
  onClose,
  onCreate,
  onSave,
}: {
  clubId: string;
  clubName: string;
  currentUserId: string;
  event?: ClubEvent;
  onClose: () => void;
  onCreate: (e: ClubEvent) => void;
  onSave?: (e: ClubEvent) => void;
}) {
  const isEdit = event != null;
  const [form, setForm] = useState<CreateForm>(event ? eventToForm(event) : emptyForm());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const url = await uploadImage("events", file);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function set(field: keyof CreateForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  }

  const FORMAT_API = {
    "in-person": "IN_PERSON",
    online: "ONLINE",
    hybrid: "HYBRID",
  } as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.location.trim()) { setError("Location is required."); return; }
    if (!form.startsAt) { setError("Start date/time is required."); return; }
    if (!form.endsAt) { setError("End date/time is required."); return; }
    // Allow editing events that have already started; only enforce future start on create.
    if (!isEdit && new Date(form.startsAt) <= new Date()) {
      setError("Start must be in the future.");
      return;
    }
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError("End must be after start.");
      return;
    }
    const cap = form.capacity.trim();
    if (cap && (!/^\d+$/.test(cap) || Number(cap) < 1)) {
      setError("Capacity must be a whole number of at least 1.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        format: FORMAT_API[form.format],
        location: form.location.trim() || undefined,
        startTime: new Date(form.startsAt).toISOString(),
        endTime: new Date(form.endsAt).toISOString(),
        maxMembers: cap ? Number(cap) : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
      };
      if (isEdit) {
        const saved = await updateEvent(event.id, payload);
        onSave?.(saved);
      } else {
        const created = await createEvent(clubId, payload);
        onCreate(created);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? "save" : "create"} event`);
    } finally {
      setSubmitting(false);
    }
  }

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

function ManageForm({ club, events, currentUserId }: Props) {
  return null;
}
