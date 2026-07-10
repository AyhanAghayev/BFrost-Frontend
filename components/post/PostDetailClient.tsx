"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import type { Post, Comment, User } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getPost, getComments, addComment, reactToPost, savePost, unsavePost } from "@/lib/api/posts";
import { getTrending } from "@/lib/api/trending";
import type { TrendingTopic } from "@/lib/mock/trending";

interface Props {
  postId: string;
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  owner: { label: "Club Owner", className: "bg-primary-container text-white" },
  moderator: { label: "Moderator", className: "bg-action-blue text-white" },
};

export default function PostDetailClient({ postId }: Props) {
  const { currentUser } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    getTrending().then(setTrendingTopics).catch(() => setTrendingTopics([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getPost(postId), getComments(postId)])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setLiked(postData.isLiked);
        setLikeCount(postData.likeCount);
        setSaved(postData.isSaved);
        setComments(commentsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading || !post) {
    return (
      <main className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter pb-20 lg:pb-gutter">
        <div className="bg-white rounded-xl border border-border-subtle p-gutter animate-pulse">
          <div className="flex gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-surface-container" />
            <div className="flex-1">
              <div className="h-4 bg-surface-container rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-container rounded w-1/4" />
            </div>
          </div>
          <div className="h-6 bg-surface-container rounded mb-3" />
          <div className="h-4 bg-surface-container rounded mb-2" />
          <div className="h-4 bg-surface-container rounded w-3/4" />
        </div>
      </main>
    );
  }

  function handleLike() {
    const wasLiked = liked;
    setLikeCount((p) => (wasLiked ? p - 1 : p + 1));
    setLiked(!wasLiked);
    reactToPost(post!.id, "LIKE").catch(() => {
      setLikeCount((p) => (wasLiked ? p + 1 : p - 1));
      setLiked(wasLiked);
    });
  }

  function handleSave() {
    const wasSaved = saved;
    setSaved(!wasSaved);
    (wasSaved ? unsavePost(post!.id) : savePost(post!.id)).catch(() => setSaved(wasSaved));
  }

  async function submitComment() {
    if (!commentBody.trim() || !currentUser) return;
    try {
      const c = await addComment(post!.id, commentBody.trim());
      setComments((p) => [c, ...p]);
      setCommentBody("");
    } catch (e) {
      console.error(e);
    }
  }

  const badge = ROLE_BADGE[post.authorRole];

  return (
    <main className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter pb-20 lg:pb-gutter">
      <div className="flex flex-col lg:flex-row gap-gutter">
        <div className="flex-1 min-w-0 space-y-gutter">
          <article className="bg-white rounded-xl border border-border-subtle overflow-hidden shadow-sm">
            <div className="p-gutter">
              <div className="flex justify-between items-center mb-stack-md">
                <div className="flex items-center gap-stack-md">
                  <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
                    <img
                      src={post.author.avatarUrl}
                      alt={post.author.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/profile/${post.author.username}`}
                        className="font-label-md text-primary hover:underline"
                      >
                        {post.author.displayName}
                      </Link>
                      {badge && (
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-label-sm text-on-surface-variant">
                      @{post.author.username} •{" "}
                      <Link
                        href={post.targetKind === "user" ? `/profile/${post.clubId}` : `/clubs/${post.clubId}`}
                        className="hover:underline"
                      >
                        {post.clubName}
                      </Link>{" "}
                      • {formatRelativeTime(post.createdAt)}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    more_horiz
                  </span>
                </button>
              </div>

              <div className="space-y-stack-md">
                {post.title && (
                  <h1 className="font-headline-lg text-headline-lg text-primary">
                    {post.title}
                  </h1>
                )}
                <p className="text-on-surface leading-relaxed whitespace-pre-line">
                  {post.body}
                </p>
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video relative group">
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {post.linkUrl && (
                  <a
                    href={post.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-[32px]">
                      link
                    </span>
                    <div className="min-w-0">
                      <span className="font-label-sm text-on-surface-variant uppercase block">
                        External Link
                      </span>
                      <span className="font-label-md text-on-surface truncate block">
                        {post.linkUrl}
                      </span>
                    </div>
                  </a>
                )}
              </div>

              <div className="mt-gutter pt-stack-md border-t border-border-subtle flex items-center justify-between">
                <div className="flex items-center gap-gutter">
                  <button
                    onClick={handleLike}
                    className={cn(
                      "flex items-center gap-stack-sm group transition-colors",
                      liked
                        ? "text-action-blue"
                        : "text-on-surface-variant hover:text-action-blue"
                    )}
                  >
                    <span
                      className="material-symbols-outlined group-hover:scale-110 transition-transform"
                      style={
                        liked
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      favorite
                    </span>
                    <span className="font-label-md">{formatCount(likeCount)}</span>
                  </button>
                  <button className="flex items-center gap-stack-sm text-on-surface-variant hover:text-action-blue transition-colors group">
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                      chat_bubble
                    </span>
                    <span className="font-label-md">
                      {comments.length} Comments
                    </span>
                  </button>
                  <button className="flex items-center gap-stack-sm text-on-surface-variant hover:text-action-blue transition-colors group">
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                      share
                    </span>
                    <span className="font-label-md">Share</span>
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    saved
                      ? "text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  )}
                >
                  <span
                    className="material-symbols-outlined"
                    style={
                      saved
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    bookmark
                  </span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
