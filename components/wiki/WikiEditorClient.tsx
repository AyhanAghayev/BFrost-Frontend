"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getClub } from "@/lib/api/clubs";
import {
  getWikiArticle,
  createWikiArticle,
  updateWikiArticle,
  getAiStatus,
  aiDraft,
  aiSummarize,
} from "@/lib/api/wiki";
import Markdown from "./Markdown";

const inputCls =
  "w-full px-4 py-3 bg-surface-faint border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-action-blue transition-all";

export default function WikiEditorClient({ clubSlug, articleId }: { clubSlug: string; articleId?: string }) {
  const router = useRouter();
  const isEdit = !!articleId;

  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [featured, setFeatured] = useState(false);

  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiBusy, setAiBusy] = useState<"draft" | "summary" | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const club = await getClub(clubSlug);
        const canManage = club.currentUserRole === "owner" || club.currentUserRole === "moderator";
        if (!canManage) { setAllowed(false); return; }
        setClubId(club.id);
        if (articleId) {
          const a = await getWikiArticle(articleId);
          setTitle(a.title);
          setSummary(a.summary);
          setBody(a.body);
          setFeatured(a.isFeatured);
        }
        getAiStatus().then(setAiEnabled).catch(() => setAiEnabled(false));
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [clubSlug, articleId]);

  async function handleSave() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { title: title.trim(), summary: summary.trim() || undefined, body, featured };
      const saved = isEdit
        ? await updateWikiArticle(articleId!, payload)
        : await createWikiArticle(clubId!, payload);
      router.push(`/clubs/${clubSlug}/wiki/${saved.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  async function handleDraft() {
    if (!clubId || !title.trim()) { setError("Add a title first — the AI drafts from it."); return; }
    setAiBusy("draft");
    setError("");
    try {
      const res = await aiDraft(clubId, title.trim());
      setBody(res.body);
      if (res.summary) setSummary(res.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't generate a draft");
    } finally {
      setAiBusy(null);
    }
  }

  async function handleSummarize() {
    if (!clubId || !body.trim()) { setError("Write some content first, then summarize it."); return; }
    setAiBusy("summary");
    setError("");
    try {
      setSummary(await aiSummarize(clubId, body));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't summarize");
    } finally {
      setAiBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <div className="animate-pulse h-64 bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">You don&apos;t have permission to edit this club&apos;s wiki.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter max-w-3xl">
      <div className="flex items-center justify-between mb-stack-lg">
        <h1 className="font-headline-md text-headline-md text-primary">
          {isEdit ? "Edit article" : "New article"}
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href={isEdit ? `/clubs/${clubSlug}/wiki/${articleId}` : `/clubs/${clubSlug}`}
            className="px-4 py-2 rounded-lg border border-border-subtle text-on-surface-variant font-label-md text-label-md hover:bg-surface-faint transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-stack-md">
        <input
          className={cn(inputCls, "text-lg font-semibold")}
          placeholder="Article title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <input
            className={inputCls}
            placeholder="Short summary (optional)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
          />
          {aiEnabled && (
            <button
              onClick={handleSummarize}
              disabled={aiBusy !== null}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-3 rounded-xl border border-action-blue/30 text-action-blue text-sm font-label-md hover:bg-action-blue/5 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              {aiBusy === "summary" ? "…" : "Summarize"}
            </button>
          )}
        </div>

        <div className="border border-border-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-faint">
            <div className="flex gap-1">
              <button
                onClick={() => setPreview(false)}
                className={cn("px-3 py-1 rounded-md text-sm font-label-md", !preview ? "bg-white text-primary shadow-sm" : "text-on-surface-variant")}
              >
                Write
              </button>
              <button
                onClick={() => setPreview(true)}
                className={cn("px-3 py-1 rounded-md text-sm font-label-md", preview ? "bg-white text-primary shadow-sm" : "text-on-surface-variant")}
              >
                Preview
              </button>
            </div>
            {aiEnabled && (
              <button
                onClick={handleDraft}
                disabled={aiBusy !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-blue/10 text-action-blue text-sm font-label-md hover:bg-action-blue/15 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                {aiBusy === "draft" ? "Generating…" : "Generate draft"}
              </button>
            )}
          </div>
          {preview ? (
            <div className="p-4 min-h-[320px]">
              {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-on-surface-variant text-sm">Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea
              className="w-full min-h-[320px] p-4 text-sm font-mono resize-y outline-none"
              placeholder="Write your article in Markdown…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Feature this article on the club page
        </label>

        {error && (
          <p className="text-error text-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
