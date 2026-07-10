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

          <section className="bg-white rounded-xl border border-border-subtle p-gutter shadow-sm">
            <h2 className="font-headline-md text-headline-md text-primary mb-gutter">
              Discussion
            </h2>

            {currentUser && (
              <div className="flex gap-stack-md mb-stack-lg">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 space-y-stack-sm">
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Add to the discussion..."
                    className="w-full bg-surface-container-low border-none rounded-xl p-stack-md focus:ring-2 focus:ring-action-blue text-body-md min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end gap-stack-sm">
                    <button
                      onClick={() => setCommentBody("")}
                      className="px-stack-md py-2 text-label-md text-action-blue font-bold hover:bg-surface-container-low rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitComment}
                      disabled={!commentBody.trim()}
                      className="px-gutter py-2 bg-primary text-white font-label-md rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-stack-lg">
              {comments.length === 0 ? (
                <p className="text-on-surface-variant text-center py-4">
                  No comments yet. Start the discussion!
                </p>
              ) : (
                comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    currentUser={currentUser}
                  />
                ))
              )}
            </div>

            {comments.length > 5 && (
              <button className="w-full mt-stack-lg py-3 text-label-md text-action-blue font-bold border border-action-blue rounded-xl hover:bg-action-blue/5 transition-colors">
                View more comments
              </button>
            )}
          </section>
        </div>

        <aside className="hidden lg:flex flex-col gap-gutter w-80 flex-shrink-0">

          <div className="bg-primary-container rounded-xl p-gutter shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-label-md uppercase tracking-wider text-on-primary-container mb-stack-md">
                Trending Topics
              </h3>
              <ul className="space-y-stack-md">
                {trendingTopics.map((t, i) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span className="font-label-md text-on-primary-container/90">
                      {t.tag}
                    </span>
                    {i === 0 ? (
                      <span className="text-label-sm bg-white/10 text-on-primary-container px-2 py-1 rounded">
                        Hot
                      </span>
                    ) : (
                      <span className="text-label-sm text-on-primary-container/60">
                        {t.summary}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="px-2 flex flex-wrap gap-x-stack-md gap-y-stack-sm">
            {["Privacy", "Terms", "About"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-label-sm text-on-surface-variant hover:underline"
              >
                {l}
              </a>
            ))}
            <span className="text-label-sm text-on-surface-variant">
              © 2026 BFrost
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

/* ─────────────── Comment Item ─────────────── */

function CommentItem({
  comment,
  depth = 0,
  currentUser,
}: {
  comment: Comment;
  depth?: number;
  currentUser: User | null;
}) {
  const [liked, setLiked] = useState(comment.isLiked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  function toggleLike() {
    setLikeCount((p) => (liked ? p - 1 : p + 1));
    setLiked((p) => !p);
  }

  return (
    <div className={cn("flex gap-stack-md", depth > 0 && "ml-stack-lg mt-stack-md")}>
      <Link href={`/profile/${comment.author.username}`} className="flex-shrink-0">
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.displayName}
          className={cn(
            "rounded-full object-cover",
            depth > 0 ? "w-8 h-8" : "w-10 h-10"
          )}
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "p-stack-md rounded-xl",
            depth > 0 ? "bg-surface-container" : "bg-surface-container-low"
          )}
        >
          <div className="flex justify-between items-center mb-1">
            <Link
              href={`/profile/${comment.author.username}`}
              className="font-label-md text-primary hover:underline"
            >
              {comment.author.displayName}
            </Link>
            <span className="text-label-sm text-on-surface-variant">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-on-surface leading-relaxed">{comment.body}</p>
        </div>

        <div className="flex gap-gutter mt-1 px-stack-md">
          {depth === 0 && (
            <button
              onClick={() => setShowReply((s) => !s)}
              className="text-label-sm text-action-blue font-bold"
            >
              Reply
            </button>
          )}
          <button
            onClick={toggleLike}
            className={cn(
              "text-label-sm transition-colors",
              liked ? "text-action-blue font-bold" : "text-on-surface-variant"
            )}
          >
            {liked && likeCount > 0
              ? `Liked (${formatCount(likeCount)})`
              : "Like"}
          </button>
        </div>

        {showReply && currentUser && depth === 0 && (
          <div className="flex gap-stack-sm mt-stack-sm ml-stack-sm">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1"
            />
            <div className="flex-1 space-y-stack-sm">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={`Reply to ${comment.author.displayName}…`}
                rows={2}
                className="w-full bg-surface-container-low border-none rounded-xl p-2 focus:ring-1 focus:ring-action-blue text-sm resize-none"
              />
              <div className="flex justify-end gap-stack-sm">
                <button
                  onClick={() => {
                    setShowReply(false);
                    setReplyBody("");
                  }}
                  className="px-3 py-1.5 text-label-sm text-action-blue font-bold hover:bg-surface-container-low rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowReply(false);
                    setReplyBody("");
                  }}
                  disabled={!replyBody.trim()}
                  className="px-3 py-1.5 bg-primary text-white text-label-sm rounded-lg hover:opacity-90 disabled:opacity-40"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {comment.replies?.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
