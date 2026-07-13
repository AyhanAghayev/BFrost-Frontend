"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { WikiArticle } from "@/lib/types";
import { getWikiFeed } from "@/lib/api/wiki";
import { formatRelativeTime } from "@/lib/utils/format";

export default function WikiHubClient() {
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWikiFeed()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter max-w-3xl">
      <div className="mb-stack-lg">
        <h1 className="font-headline-md text-headline-md text-primary">Wiki Hub</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Articles from the clubs you&apos;re in.
        </p>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">book_2</span>
          <p className="text-sm text-on-surface-variant">
            No articles yet. Join clubs or ask a mod to add some.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-stack-md">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/clubs/${article.clubSlug}/wiki/${article.id}`}
              className="block bg-white border border-border-subtle rounded-xl p-gutter hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-label-md text-label-md text-primary truncate">{article.title}</h3>
                    {article.isFeatured && (
                      <span className="flex-shrink-0 bg-primary text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2">{article.summary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-subtle text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {article.clubName}
                </span>
                <span>•</span>
                <span>Updated {formatRelativeTime(article.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
