"use client";

import { useState, useEffect } from "react";
import type { Post } from "@/lib/types";
import { getFeed } from "@/lib/api/posts";
import PostCreatorCard from "@/components/feed/PostCreatorCard";
import FeedSection from "@/components/feed/FeedSection";
import TrendingTopicsCard from "@/components/sidebar/TrendingTopicsCard";
import PeopleSuggestionsCard from "@/components/sidebar/PeopleSuggestionsCard";
import { getTrending } from "@/lib/api/trending";
import type { TrendingTopic } from "@/lib/mock/trending";

export default function DiscoverFeedPageClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    setLoading(true);
    getFeed()
      .then((page) => {
        setPosts(page.items);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    getTrending().then(setTrending).catch(() => setTrending([]));
  }, []);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getFeed(nextCursor);
      setPosts((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="flex-1 px-margin-mobile md:px-gutter py-gutter pb-20 lg:pb-gutter">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Feed column */}
        <div className="md:col-span-8 flex flex-col gap-gutter">
          <PostCreatorCard />
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-border-subtle rounded-xl p-gutter animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container" />
                    <div className="flex-1">
                      <div className="h-4 bg-surface-container rounded w-1/3 mb-2" />
                      <div className="h-3 bg-surface-container rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-4 bg-surface-container rounded mb-2" />
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <FeedSection posts={posts} />
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 border border-border-subtle rounded-xl text-on-surface-variant font-label-md hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </div>

    
        <aside className="hidden xl:flex flex-col gap-gutter md:col-span-4">
          <TrendingTopicsCard topics={trending} />
          <PeopleSuggestionsCard users={[]} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 opacity-60">
            <a className="text-[10px] hover:underline uppercase tracking-tighter" href="#">About</a>
            <a className="text-[10px] hover:underline uppercase tracking-tighter" href="#">Privacy</a>
            <a className="text-[10px] hover:underline uppercase tracking-tighter" href="#">Terms</a>
            <span className="text-[10px] uppercase tracking-tighter">© 2026 BFrost</span>
          </div>
        </aside>
      </div>
    </main>
  );
}