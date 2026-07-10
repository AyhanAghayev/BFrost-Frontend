"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatCount } from "@/lib/utils/format";
import type { Post } from "@/lib/types";
import { reactToPost, deletePost, savePost, unsavePost } from "@/lib/api/posts";
import { useAuthStore } from "@/lib/stores/auth.store";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  owner: { label: "Club Owner", className: "bg-primary-container text-white" },
  moderator: { label: "Moderator", className: "bg-action-blue text-white" },
};

export default function PostCard({ post }: { post: Post }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.isSaved);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAuthor = currentUser?.id === post.authorId;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleDelete() {
    setMenuOpen(false);
    setDeleted(true);
    try {
      await deletePost(post.id);
    } catch {
      setDeleted(false);
    }
  }

  function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    reactToPost(post.id, "LIKE").catch(() => {
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    });
  }

  function toggleSave() {
    const wasSaved = saved;
    setSaved(!wasSaved);
    (wasSaved ? unsavePost(post.id) : savePost(post.id)).catch(() => setSaved(wasSaved));
  }

  if (deleted) return null;

  if (post.type === "question") {
    return <QuestionCard post={post} />;
  }

  const badge = ROLE_BADGE[post.authorRole];

  return (
    <article className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black/[0.04] transition-shadow p-gutter">
      {/* Author row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-stack-md">
          <Link href={`/profile/${post.author.username}`} className="relative flex-shrink-0">
            <img
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover"
              src={post.author.avatarUrl}
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
              <span className="text-on-surface-variant text-xs">•</span>
              <Link
                href={post.targetKind === "user" ? `/profile/${post.clubId}` : `/clubs/${post.clubId}`}
                className="font-label-md text-action-blue hover:underline"
              >
                {post.clubName}
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
            <span className="text-label-sm text-on-surface-variant">
              {post.channel} • {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
          >
            more_horiz
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 bg-white border border-border-subtle rounded-xl shadow-lg py-1 z-20">
              {isAuthor ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete post
                </button>
              ) : (
                <button
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]">flag</span>
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Link href={`/posts/${post.id}`} className="block group/content">
          {post.title && (
            <h2 className="font-headline-md text-headline-md text-primary mb-3 group-hover/content:text-action-blue transition-colors">
              {post.title}
            </h2>
          )}
          <p className="text-on-surface-variant leading-relaxed">{post.body}</p>
          {post.imageUrl && (
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border-subtle mt-3 overflow-hidden">
              <img
                alt="Post image"
                className="w-full h-full object-cover group-hover/content:scale-105 transition-transform duration-500"
                src={post.imageUrl}
              />
            </div>
          )}
        </Link>

      
        {post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl border border-border-subtle bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-[32px]">link</span>
            <div className="min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                External Link
              </span>
              <span className="font-label-md text-on-surface truncate block">{post.linkUrl}</span>
            </div>
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-subtle text-on-surface-variant">
        <div className="flex gap-6">
          <button
            onClick={toggleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors group",
              liked ? "text-action-blue" : "hover:text-action-blue"
            )}
          >
            <span
              className="material-symbols-outlined text-[20px] group-active:scale-125 transition-transform"
              style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              thumb_up
            </span>
            <span className="text-label-md">{formatCount(likeCount)}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-action-blue transition-colors">
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            <span className="text-label-md">{post.commentCount}</span>
          </button>
        </div>
        <button
          onClick={toggleSave}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            saved ? "text-primary" : "hover:text-primary"
          )}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={saved ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            bookmark
          </span>
          <span className="text-label-md">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </article>
  );
}

function QuestionCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  function toggleUpvote() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    reactToPost(post.id, "LIKE").catch(() => {
      setLiked(wasLiked);
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    });
  }

  return (
    <article className="bg-white border border-border-subtle rounded-xl p-gutter hover:shadow-lg hover:shadow-black/[0.04] transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-stack-md">
          <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
            <img
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover"
              src={post.author.avatarUrl}
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-label-md text-primary hover:underline"
              >
                {post.author.displayName}
              </Link>
              <span className="text-on-surface-variant text-xs">•</span>
              <span className="text-label-sm text-on-surface-variant">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <span className="text-label-sm text-on-surface-variant">
              Question in{" "}
              <Link href={post.targetKind === "user" ? `/profile/${post.clubId}` : `/clubs/${post.clubId}`} className="text-primary font-bold">
                {post.clubName}
              </Link>
            </span>
          </div>
        </div>
        <button className="material-symbols-outlined text-on-surface-variant">more_horiz</button>
      </div>

      <Link href={`/posts/${post.id}`} className="block text-body-md text-on-surface leading-relaxed pb-4 hover:opacity-80 transition-opacity">
        {post.body}
      </Link>

      <div className="flex items-center gap-6 pt-4 border-t border-border-subtle text-on-surface-variant">
        <button
          onClick={toggleUpvote}
          className={cn(
            "flex items-center gap-1.5 transition-colors group",
            liked ? "text-action-blue" : "hover:text-action-blue"
          )}
        >
          <span
            className="material-symbols-outlined text-[20px] group-active:scale-125 transition-transform"
            style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            thumb_up
          </span>
          <span className="text-label-md">{formatCount(likeCount)}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-action-blue transition-colors">
          <span className="material-symbols-outlined text-[20px]">reply</span>
          <span className="text-label-md">{post.commentCount} Answers</span>
        </button>
      </div>
    </article>
  );
}