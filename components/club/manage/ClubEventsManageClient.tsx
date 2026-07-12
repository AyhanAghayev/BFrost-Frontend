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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-xl border border-border-subtle w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <h2 className="font-headline-md text-headline-md text-primary">
            {isEdit ? "Edit Event" : "Create Event"}
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* cover image */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Cover image{" "}
              <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCover}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="relative group block h-32 w-full rounded-xl border-2 border-dashed border-border-subtle overflow-hidden hover:border-action-blue transition-colors bg-surface-faint disabled:cursor-wait"
            >
              {form.coverImageUrl && (
                <img
                  src={form.coverImageUrl}
                  alt="Event cover"
                  className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                />
              )}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-1 transition-opacity z-10",
                  uploadingCover || !form.coverImageUrl ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <span className="material-symbols-outlined text-action-blue text-[26px]">
                  {uploadingCover ? "hourglass_empty" : "add_photo_alternate"}
                </span>
                <span className="text-[11px] font-bold text-action-blue uppercase tracking-wider">
                  {uploadingCover ? "Uploading…" : form.coverImageUrl ? "Replace image" : "Add cover image"}
                </span>
              </div>
            </button>
          </div>

          {/* title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Event title
            </label>
            <input
              className={inputCls}
              placeholder="e.g. Spring Hackathon Kickoff"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* format */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Format
            </label>
            <div className="flex gap-2">
              {(["in-person", "online", "hybrid"] as EventFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => set("format", f)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-body-sm font-medium transition-colors ${
                    form.format === f
                      ? "border-action-blue bg-action-blue/[0.06] text-action-blue"
                      : "border-border-subtle text-on-surface-variant hover:border-action-blue/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {FORMAT_META[f].icon}
                  </span>
                  {FORMAT_META[f].label}
                </button>
              ))}
            </div>
          </div>

          {/* location */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Location
            </label>
            <input
              className={inputCls}
              placeholder={
                form.format === "online"
                  ? "e.g. Zoom (link sent to members)"
                  : "e.g. Engineering Building, Lab 3"
              }
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>

          {/* dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">
                Starts
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                min={toDatetimeLocal(new Date().toISOString())}
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">
                Ends
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                min={form.startsAt || toDatetimeLocal(new Date().toISOString())}
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </div>
          </div>

          {/* capacity */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Capacity{" "}
              <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className={inputCls}
              placeholder="Max attendees — leave blank for unlimited"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </div>

          {/* description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface">
              Description{" "}
              <span className="font-normal text-on-surface-variant">(optional)</span>
            </label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="What should attendees expect?"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {error && (
            <p className="text-error text-body-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border-subtle text-on-surface-variant font-label-md hover:bg-surface-faint transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create event")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── RSVPsModal ────────────────────────────────────────────────────────────────

function RSVPsModal({
  event,
  onClose,
}: {
  event: ClubEvent;
  onClose: () => void;
}) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    getEventAttendees(event.id)
      .then(setAttendees)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [event.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border-subtle w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-headline-md text-primary">RSVPs</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-body-sm mb-1 line-clamp-1 font-medium text-on-surface">
          {event.title}
        </p>
        <p className="text-body-sm text-on-surface-variant mb-5">{fmtDateShort(event.startsAt)}</p>

        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-bold text-primary font-headline-md">
            {loading ? "—" : attendees.length}
          </span>
          <span className="text-on-surface-variant text-body-sm mb-1">
            attendee{attendees.length === 1 ? "" : "s"} confirmed
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-error text-body-sm">{error}</p>
        ) : attendees.length === 0 ? (
          <p className="text-on-surface-variant text-body-sm py-4 text-center">
            No RSVPs yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto -mx-2">
            {attendees.map((a) => (
              <Link
                key={a.userId}
                href={`/profile/${a.username}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-faint transition-colors"
              >
                <img
                  src={a.profilePictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${a.username}`}
                  alt={a.displayName}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">
                    {a.displayName}
                  </p>
                  <p className="text-body-sm text-on-surface-variant truncate">
                    @{a.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ManageForm({ club, events, currentUserId }: Props) {
  return null;
}
