"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WikiArticle } from "@/lib/types";
import { getWikiArticle, deleteWikiArticle, updateWikiArticle } from "@/lib/api/wiki";
import { formatRelativeTime } from "@/lib/utils/format";
import Markdown from "./Markdown";

export default function WikiArticleClient({ clubSlug, articleId }: { clubSlug: string; articleId: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getWikiArticle(articleId)
      .then(setArticle)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  async function handleDelete() {
    if (!article || !confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteWikiArticle(article.id);
      router.push(`/clubs/${clubSlug}`);
    } catch {
      setBusy(false);
    }
  }

  async function toggleFeatured() {
    if (!article) return;
    setBusy(true);
    try {
      const updated = await updateWikiArticle(article.id, { featured: !article.isFeatured });
      setArticle(updated);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <div className="animate-pulse space-y-stack-md">
          <div className="h-4 bg-surface-container-high rounded w-1/4" />
          <div className="h-8 bg-surface-container-high rounded w-2/3" />
          <div className="h-64 bg-surface-container-high rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">{error ?? "Article not found."}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-on-surface-variant mb-stack-md">
        <Link href={`/clubs/${article.clubSlug}`} className="hover:text-primary transition-colors">
          {article.clubName}
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface-variant">Wiki</span>
      </nav>

      <div className="flex items-start justify-between gap-4 mb-stack-md">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-headline-lg text-headline-lg text-primary">{article.title}</h1>
            {article.isFeatured && (
              <span className="bg-primary text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold">
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <img src={article.author.avatarUrl} alt={article.author.displayName} className="w-6 h-6 rounded-full object-cover" />
            <Link href={`/profile/${article.author.username}`} className="hover:text-primary transition-colors">
              {article.author.displayName}
            </Link>
            <span>•</span>
            <span>Updated {formatRelativeTime(article.updatedAt)}</span>
          </div>
        </div>

        {article.canManage && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleFeatured}
              disabled={busy}
              title={article.isFeatured ? "Unfeature" : "Feature"}
              className="p-2 rounded-lg border border-border-subtle text-on-surface-variant hover:bg-surface-faint transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]" style={article.isFeatured ? { fontVariationSettings: "'FILL' 1" } : undefined}>star</span>
            </button>
            <Link
              href={`/clubs/${clubSlug}/wiki/${article.id}/edit`}
              className="px-3 py-2 rounded-lg border border-border-subtle text-on-surface font-label-md text-label-md hover:bg-surface-faint transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="px-3 py-2 rounded-lg border border-red-200 text-error font-label-md text-label-md hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <article className="bg-white border border-border-subtle rounded-xl p-gutter">
        <Markdown>{article.body}</Markdown>
      </article>
    </div>
  );
}
