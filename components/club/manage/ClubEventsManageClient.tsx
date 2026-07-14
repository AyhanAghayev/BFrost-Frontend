"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { defaultEventCoverStyle } from "@/lib/eventCover";
import type { Club, ClubEvent, EventFormat, QuestionType } from "@/lib/types";
import { getClub } from "@/lib/api/clubs";
import { uploadImage } from "@/lib/api/upload";
import {
  getClubEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventResponses,
  checkInAttendee,
  type EventResponse,
  type QuestionInput,
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

interface QuestionDraft {
  label: string;
  type: QuestionType;
  required: boolean;
  options: string[];
}

interface CreateForm {
  title: string;
  format: EventFormat;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  description: string;
  coverImageUrl: string;
  questions: QuestionDraft[];
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
  questions: [],
});

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "SHORT_TEXT", label: "Short text" },
  { value: "LONG_TEXT", label: "Paragraph" },
  { value: "SINGLE_CHOICE", label: "Single choice" },
  { value: "MULTI_CHOICE", label: "Multiple choice" },
  { value: "YES_NO", label: "Yes / No" },
];

const isChoice = (t: QuestionType) => t === "SINGLE_CHOICE" || t === "MULTI_CHOICE";

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
    questions: e.questions.map((q) => ({
      label: q.label, type: q.type, required: q.required, options: [...q.options],
    })),
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

  function addQuestion() {
    setForm((f) => ({ ...f, questions: [...f.questions, { label: "", type: "SHORT_TEXT", required: false, options: [] }] }));
  }
  function updateQuestion(i: number, patch: Partial<QuestionDraft>) {
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }));
  }
  function removeQuestion(i: number) {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  }
  function setOption(qi: number, oi: number, value: string) {
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q) }));
  }
  function addOption(qi: number) {
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) =>
      idx === qi ? { ...q, options: [...q.options, ""] } : q) }));
  }
  function removeOption(qi: number, oi: number) {
    setForm((f) => ({ ...f, questions: f.questions.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q) }));
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
      // Drop blank questions; keep only real options for choice types.
      const questions: QuestionInput[] = form.questions
        .filter((q) => q.label.trim())
        .map((q) => ({
          label: q.label.trim(),
          type: q.type,
          required: q.required,
          options: isChoice(q.type) ? q.options.map((o) => o.trim()).filter(Boolean) : [],
        }));
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        format: FORMAT_API[form.format],
        location: form.location.trim() || undefined,
        startTime: new Date(form.startsAt).toISOString(),
        endTime: new Date(form.endsAt).toISOString(),
        maxMembers: cap ? Number(cap) : undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        questions,
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

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-md text-label-md text-on-surface">Registration form</p>
                <p className="text-[12px] text-on-surface-variant">
                  Questions attendees answer when they RSVP. Leave empty for one-click RSVP.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex-shrink-0 inline-flex items-center gap-1 text-action-blue text-sm font-label-md hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add question
              </button>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-border-subtle p-3 flex flex-col gap-2 bg-surface-faint/50">
                <div className="flex items-start gap-2">
                  <input
                    className={inputCls}
                    placeholder={`Question ${qi + 1}`}
                    value={q.label}
                    onChange={(e) => updateQuestion(qi, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    title="Remove question"
                    className="flex-shrink-0 p-2.5 text-error hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    className="bg-surface-faint border border-border-subtle rounded-lg px-3 py-1.5 text-sm"
                    value={q.type}
                    onChange={(e) => updateQuestion(qi, { type: e.target.value as QuestionType })}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(qi, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
                {isChoice(q.type) && (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-on-surface-variant text-sm">•</span>
                        <input
                          className="flex-1 bg-white border border-border-subtle rounded-lg px-3 py-1.5 text-sm"
                          placeholder={`Option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => setOption(qi, oi, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(qi, oi)}
                          className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-error"
                        >
                          close
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      className="self-start text-action-blue text-sm font-label-md hover:underline ml-4"
                    >
                      + Add option
                    </button>
                  </div>
                )}
              </div>
            ))}
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
  const [responses, setResponses] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    getEventResponses(event.id)
      .then(setResponses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [event.id]);

  async function toggleCheckIn(userId: string, attended: boolean) {
    setResponses((prev) => prev.map((r) => (r.userId === userId ? { ...r, attended } : r)));
    try {
      await checkInAttendee(event.id, userId, attended);
    } catch {
      setResponses((prev) => prev.map((r) => (r.userId === userId ? { ...r, attended: !attended } : r)));
    }
  }

  const going = responses.filter((r) => r.status === "ATTENDING");
  const waitlisted = responses.filter((r) => r.status === "WAITLISTED");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border-subtle w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="min-w-0">
            <h2 className="font-headline-md text-headline-md text-primary truncate">Registrations</h2>
            <p className="text-body-sm text-on-surface-variant">
              {going.length} going{waitlisted.length > 0 ? ` · ${waitlisted.length} waitlisted` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-error text-body-sm">{error}</p>
          ) : responses.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm py-6 text-center">No registrations yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {responses.map((r) => (
                <div key={r.userId} className="rounded-xl border border-border-subtle p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.profilePictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.username}`}
                      alt={r.displayName}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <Link href={`/profile/${r.username}`} className="min-w-0 flex-1">
                      <p className="font-label-md text-label-md text-on-surface truncate hover:underline">{r.displayName}</p>
                      <p className="text-body-sm text-on-surface-variant truncate">@{r.username}</p>
                    </Link>
                    {r.status === "WAITLISTED" ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded bg-amber-50 text-amber-700">Waitlist</span>
                    ) : (
                      <label className="flex items-center gap-1.5 text-sm text-on-surface-variant cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.attended}
                          onChange={(e) => toggleCheckIn(r.userId, e.target.checked)}
                        />
                        Checked in
                      </label>
                    )}
                  </div>
                  {r.answers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border-subtle flex flex-col gap-1">
                      {r.answers.map((a) => (
                        <div key={a.questionId} className="text-sm">
                          <span className="text-on-surface-variant">{a.label}: </span>
                          <span className="text-on-surface">{a.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: string;
}) {
  return (
    <div className="bg-white border border-border-subtle rounded-xl p-stack-md flex flex-col gap-2">
      <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
        {label}
      </span>
      <span className="text-3xl font-bold text-primary font-headline-md">{value}</span>
      <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm mt-auto">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        <span>{sub}</span>
      </div>
    </div>
  );
}

// ── EventRow ─────────────────────────────────────────────────────────────────

function EventRow({
  event,
  onEdit,
  onDelete,
  onViewRSVPs,
}: {
  event: ClubEvent;
  onEdit: (e: ClubEvent) => void;
  onDelete: (id: string) => Promise<void>;
  onViewRSVPs: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState("");
  const meta = FORMAT_META[event.format];

  async function doDelete() {
    setDeleting(true);
    setDelError("");
    try {
      await onDelete(event.id);
    } catch (err: unknown) {
      setDelError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white border border-border-subtle rounded-xl overflow-hidden group hover:border-action-blue/30 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center p-stack-md gap-stack-md">
        {/* thumbnail */}
        <div className="w-full md:w-40 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-faint">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={defaultEventCoverStyle(event.id)}>
              <span className="material-symbols-outlined text-[32px] text-white/40">
                event
              </span>
            </div>
          )}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-stack-sm mb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${meta.cls}`}
            >
              <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
              {meta.label}
            </span>
            <span className="text-on-surface-variant text-body-sm truncate">
              {event.location}
            </span>
          </div>
          <h3 className="font-label-md text-label-md text-on-surface truncate mb-1">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-on-surface-variant text-body-sm line-clamp-1 mb-2">
              {event.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-stack-md text-body-sm">
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-action-blue">
                calendar_today
              </span>
              {fmtDateTime(event.startsAt)}
            </span>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-action-blue">
                group
              </span>
              {event.attendeeCount} RSVPs
            </span>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-row md:flex-col lg:flex-row gap-stack-sm shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-stack-sm">
              <span className="text-body-sm text-on-surface-variant">
                {delError || "Delete?"}
              </span>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-error text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => { setConfirmDelete(false); setDelError(""); }}
                disabled={deleting}
                className="px-3 py-1.5 border border-border-subtle rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-faint transition-colors disabled:opacity-50"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onEdit(event)}
                className="flex-1 lg:flex-none border border-border-subtle px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-faint transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
              <button
                onClick={() => onViewRSVPs(event.id)}
                className="flex-1 lg:flex-none bg-surface-faint border border-border-subtle px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-border-subtle/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                RSVPs
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-none p-2 text-error hover:bg-red-50 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function ManageForm({ club, events, currentUserId }: Props) {
  const [localEvents, setLocalEvents] = useState<ClubEvent[]>(events);
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<ClubEvent | null>(null);
  const [rsvpEventId, setRsvpEventId] = useState<string | null>(null);

  const now = useMemo(() => new Date().toISOString(), []);

  const upcoming = useMemo(
    () => localEvents.filter((e) => e.endsAt >= now),
    [localEvents, now]
  );

  const past = useMemo(
    () =>
      localEvents
        .filter((e) => e.endsAt < now)
        .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()),
    [localEvents, now]
  );

  const totalRSVPs = upcoming.reduce((s, e) => s + e.attendeeCount, 0);

  const avgAttendance =
    past.length > 0
      ? Math.round(past.reduce((s, e) => s + e.attendeeCount, 0) / past.length)
      : null;

  const nextEvent = upcoming[0] ?? null;

  async function handleDelete(id: string) {
    await deleteEvent(id);
    setLocalEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCreate(e: ClubEvent) {
    setLocalEvents((prev) =>
      [...prev, e].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
    );
  }

  function handleSave(updated: ClubEvent) {
    setLocalEvents((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    );
  }

  const rsvpEvent = rsvpEventId
    ? localEvents.find((e) => e.id === rsvpEventId) ?? null
    : null;

  return (
    <>
      {showCreate && (
        <CreateEventModal
          clubId={club.id}
          clubName={club.name}
          currentUserId={currentUserId}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {editEvent && (
        <CreateEventModal
          clubId={club.id}
          clubName={club.name}
          currentUserId={currentUserId}
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onCreate={handleCreate}
          onSave={handleSave}
        />
      )}
      {rsvpEvent && (
        <RSVPsModal event={rsvpEvent} onClose={() => setRsvpEventId(null)} />
      )}

      <div className="max-w-5xl mx-auto py-gutter px-margin-mobile md:px-gutter flex flex-col gap-stack-lg">
        {/* breadcrumb + header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-stack-md">
          <div>
            <Link
              href={`/clubs/${club.slug}`}
              className="inline-flex items-center gap-1 text-on-surface-variant text-body-sm hover:text-primary transition-colors mb-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              {club.name}
            </Link>
            <h1 className="font-headline-md text-headline-md text-primary">
              Event Management
            </h1>
            <p className="text-on-surface-variant text-body-sm mt-0.5">
              Schedule, publish, and monitor your club&apos;s events.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-stack-sm bg-primary text-white px-6 py-2.5 rounded-xl font-label-md hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create event
          </button>
        </div>

        {/* stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-stack-md">
          <StatCard
            label="Upcoming RSVPs"
            value={totalRSVPs}
            sub={`across ${upcoming.length} event${upcoming.length === 1 ? "" : "s"}`}
            icon="confirmation_number"
          />
          <StatCard
            label="Upcoming"
            value={upcoming.length}
            sub={
              nextEvent
                ? `Next: ${fmtDateShort(nextEvent.startsAt)}`
                : "No upcoming events"
            }
            icon="calendar_month"
          />
          <StatCard
            label="Events held"
            value={past.length}
            sub={past.length > 0 ? "Since club founding" : "Host your first event"}
            icon="history"
          />
          <StatCard
            label="Avg turnout"
            value={avgAttendance !== null ? avgAttendance : "—"}
            sub={avgAttendance !== null ? "attendees per event" : "No past data yet"}
            icon="groups"
          />
        </div>

        {/* upcoming events */}
        <section>
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="font-headline-md text-headline-md text-primary">
              Upcoming events
            </h2>
            <Link
              href="/events"
              className="text-action-blue font-label-md text-label-md flex items-center gap-1 hover:underline"
            >
              Public calendar
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white border border-border-subtle rounded-xl flex flex-col items-center gap-3 py-14 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
                event_upcoming
              </span>
              <p className="text-on-surface-variant text-body-sm max-w-xs">
                No upcoming events yet. Create one to start collecting RSVPs.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-1 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Create first event
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-stack-md">
              {upcoming.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  onEdit={setEditEvent}
                  onDelete={handleDelete}
                  onViewRSVPs={setRsvpEventId}
                />
              ))}
            </div>
          )}
        </section>

        {/* bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
          {/* past events table */}
          <div className="lg:col-span-2">
            <h2 className="font-headline-md text-headline-md text-primary mb-stack-md">
              Past events
            </h2>

            {past.length === 0 ? (
              <div className="bg-white border border-border-subtle rounded-xl flex flex-col items-center gap-2 py-10 text-center">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30">
                  history
                </span>
                <p className="text-on-surface-variant text-body-sm">
                  Past events will appear here after they&apos;re over.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-border-subtle rounded-xl overflow-x-auto">
                <table className="w-full text-left min-w-[480px]">
                  <thead className="bg-surface-faint border-b border-border-subtle">
                    <tr>
                      <th className="px-stack-md py-3 font-label-md text-label-md text-on-surface-variant">
                        Event
                      </th>
                      <th className="px-stack-md py-3 font-label-md text-label-md text-on-surface-variant hidden sm:table-cell">
                        Date
                      </th>
                      <th className="px-stack-md py-3 font-label-md text-label-md text-on-surface-variant">
                        Attended
                      </th>
                      <th className="px-stack-md py-3 font-label-md text-label-md text-on-surface-variant">
                        Format
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {past.map((e) => {
                      const meta = FORMAT_META[e.format];
                      return (
                        <tr key={e.id} className="hover:bg-surface-faint transition-colors">
                          <td className="px-stack-md py-3.5">
                            <p className="font-medium text-on-surface text-body-sm line-clamp-1">
                              {e.title}
                            </p>
                            <p className="text-on-surface-variant text-[12px] sm:hidden mt-0.5">
                              {fmtDateShort(e.startsAt)}
                            </p>
                          </td>
                          <td className="px-stack-md py-3.5 text-body-sm text-on-surface-variant hidden sm:table-cell whitespace-nowrap">
                            {fmtDateShort(e.startsAt)}
                          </td>
                          <td className="px-stack-md py-3.5">
                            <span className="font-semibold text-primary text-body-sm">
                              {e.attendeeCount}
                            </span>
                            <span className="text-on-surface-variant text-body-sm"> people</span>
                          </td>
                          <td className="px-stack-md py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${meta.cls}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* right panel */}
          <div className="lg:col-span-1 flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-primary">
              Quick actions
            </h2>

            {/* create CTA */}
            <div className="bg-white border border-border-subtle rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-[20px]">
                    add_circle
                  </span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">
                    Schedule an event
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    Publish in seconds.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity"
              >
                Create event
              </button>
            </div>

            {/* settings link */}
            <Link
              href={`/clubs/${club.slug}/settings`}
              className="bg-white border border-border-subtle rounded-xl p-5 flex items-center gap-3 hover:border-action-blue/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-faint flex items-center justify-center shrink-0 group-hover:bg-action-blue/10 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] group-hover:text-action-blue transition-colors">
                  settings
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-label-md text-on-surface">
                  Club settings
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Manage members & visibility
                </p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                arrow_forward_ios
              </span>
            </Link>

            {/* tip */}
            <div className="bg-action-blue/[0.05] border border-action-blue/20 rounded-xl p-5 flex gap-3">
              <span className="material-symbols-outlined text-action-blue shrink-0 mt-0.5">
                lightbulb
              </span>
              <div>
                <p className="font-label-md text-label-md text-action-blue mb-1">
                  Boost attendance
                </p>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Events with a cover image and full description get 40% more RSVPs on
                  average. Add both when you create.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}