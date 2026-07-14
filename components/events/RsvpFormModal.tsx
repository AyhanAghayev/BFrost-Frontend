"use client";

import { useState, useEffect } from "react";
import type { ClubEvent } from "@/lib/types";
import { rsvpEvent, type RsvpStatus, type AnswerInput } from "@/lib/api/events";

// Shown when an event has registration questions. Collects answers, then RSVPs.
export default function RsvpFormModal({
  event,
  onClose,
  onDone,
}: {
  event: ClubEvent;
  onClose: () => void;
  onDone: (status: RsvpStatus) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, Set<string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleMulti(qid: string, opt: string) {
    setMulti((m) => {
      const set = new Set(m[qid] ?? []);
      if (set.has(opt)) set.delete(opt); else set.add(opt);
      return { ...m, [qid]: set };
    });
  }

  function answerFor(qid: string, type: string): string {
    if (type === "MULTI_CHOICE") return Array.from(multi[qid] ?? []).join(", ");
    return values[qid] ?? "";
  }

  async function submit() {
    for (const q of event.questions) {
      if (q.required && !answerFor(q.id, q.type).trim()) {
        setError(`Please answer: ${q.label}`);
        return;
      }
    }
    setSubmitting(true);
    setError("");
    const answers: AnswerInput[] = event.questions
      .map((q) => ({ questionId: q.id, value: answerFor(q.id, q.type) }))
      .filter((a) => a.value.trim());
    try {
      const status = await rsvpEvent(event.id, "ATTENDING", answers);
      onDone(status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't submit your RSVP");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full bg-surface-faint border border-border-subtle rounded-xl px-4 py-2.5 text-body-sm focus:outline-none focus:ring-2 focus:ring-action-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-border-subtle w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="min-w-0">
            <h2 className="font-headline-md text-headline-md text-primary truncate">Register</h2>
            <p className="text-body-sm text-on-surface-variant truncate">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-4">
          {event.questions.map((q) => (
            <div key={q.id} className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">
                {q.label} {q.required && <span className="text-error">*</span>}
              </label>

              {q.type === "SHORT_TEXT" && (
                <input className={inputCls} value={values[q.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))} />
              )}
              {q.type === "LONG_TEXT" && (
                <textarea rows={3} className={`${inputCls} resize-none`} value={values[q.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))} />
              )}
              {q.type === "YES_NO" && (
                <div className="flex gap-4">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm">
                      <input type="radio" name={q.id} checked={values[q.id] === opt} onChange={() => setValues((v) => ({ ...v, [q.id]: opt }))} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "SINGLE_CHOICE" && (
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={q.id} checked={values[q.id] === opt} onChange={() => setValues((v) => ({ ...v, [q.id]: opt }))} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "MULTI_CHOICE" && (
                <div className="flex flex-col gap-1.5">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={multi[q.id]?.has(opt) ?? false} onChange={() => toggleMulti(q.id, opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {error && (
            <p className="text-error text-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-border-subtle">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border-subtle text-on-surface-variant font-label-md hover:bg-surface-faint transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-label-md hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit RSVP"}
          </button>
        </div>
      </div>
    </div>
  );
}
