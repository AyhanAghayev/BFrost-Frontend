"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import type { Club, Post, ClubEvent, WikiArticle, User } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getClub, joinClub, leaveClub, getClubMembers, type ApiMember } from "@/lib/api/clubs";
import { getClubPosts, createPost } from "@/lib/api/posts";
import { uploadImage } from "@/lib/api/upload";
import { getClubEvents } from "@/lib/api/events";

type TabType = "feed" | "resources" | "events" | "directory";

interface Props {
  slug: string;
}

function ClubPostCreator({
  currentUser,
  clubId,
  onPostCreated,
}: {
  currentUser: User | null;
  clubId: string;
  onPostCreated: (post: Post) => void;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      setMediaUrl(await uploadImage("posts", file));
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url && /^https?:\/\//.test(url.trim())) setLinkUrl(url.trim());
  }

  async function handlePost() {
    if (!body.trim() && !mediaUrl) return;
    setSubmitting(true);
    setError("");
    try {
      const post = await createPost({
        targetType: "CLUB_PAGE",
        targetId: clubId,
        postType: mediaUrl ? "IMAGE" : linkUrl ? "LINK" : "TEXT",
        body: body.trim(),
        mediaUrl: mediaUrl ?? undefined,
        linkUrl: linkUrl ?? undefined,
      });
      setBody("");
      setMediaUrl(null);
      setLinkUrl(null);
      onPostCreated(post);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-stack-md shadow-sm">
      <div className="flex gap-stack-md">
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.displayName}
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
        />
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start a conversation with the group..."
            rows={2}
            className="w-full border-none focus:ring-0 p-2 text-body-md bg-surface-container-low rounded-lg resize-none placeholder:text-on-surface-variant/60"
          />

          {mediaUrl && (
            <div className="relative w-fit mt-2">
              <img src={mediaUrl} alt="attachment" className="max-h-48 rounded-lg border border-border-subtle" />
              <button
                onClick={() => setMediaUrl(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-on-surface text-white rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}
          {linkUrl && (
            <div className="flex items-center gap-2 bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 w-fit max-w-full mt-2">
              <span className="material-symbols-outlined text-[18px] text-action-blue">link</span>
              <span className="text-sm text-action-blue truncate">{linkUrl}</span>
              <button onClick={() => setLinkUrl(null)} className="material-symbols-outlined text-[16px] text-on-surface-variant">
                close
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-4 text-on-surface-variant">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Add image"
                className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-[22px] disabled:opacity-50"
              >
                {uploading ? "hourglass_empty" : "image"}
              </button>
              <button
                onClick={handleLink}
                title="Add link"
                className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-[22px]"
              >
                link
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={submitting || (!body.trim() && !mediaUrl)}
              className="bg-primary text-white px-6 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-error mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WikiSnippetCard({ article }: { article: WikiArticle }) {
  return (
    <section className="bg-white border border-border-subtle rounded-xl p-stack-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary">
          Featured Guide
        </h3>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          menu_book
        </span>
      </div>
      <div className="border-l-4 border-primary pl-4">
        <h4 className="font-label-md text-primary mb-2 line-clamp-2">
          {article.title}
        </h4>
        <p className="text-label-sm text-on-surface-variant line-clamp-3 leading-relaxed">
          {article.summary}
        </p>
        <a
          href="#"
          className="text-action-blue text-sm font-label-md hover:underline mt-3 flex items-center gap-1"
        >
          View Full Article
          <span className="material-symbols-outlined text-[16px]">
            arrow_forward
          </span>
        </a>
      </div>
      <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between">
        <div className="flex -space-x-2">
          {article.contributorAvatarUrls.slice(0, 3).map((url, i) => (
            <img
              key={i}
              src={url}
              alt="contributor"
              className="w-7 h-7 rounded-full border-2 border-white object-cover"
            />
          ))}
        </div>
        <span className="text-label-sm text-on-surface-variant">
          Updated {formatRelativeTime(article.updatedAt)}
        </span>
      </div>
    </section>
  );
}

function ClubEventsCard({
  events,
  onViewAll,
}: {
  events: ClubEvent[];
  onViewAll: () => void;
}) {
  function parseDateParts(iso: string) {
    const d = new Date(iso);
    return {
      month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: String(d.getDate()),
    };
  }

  return (
    <section className="bg-white border border-border-subtle rounded-xl p-stack-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-label-md text-label-md uppercase tracking-wider text-primary">
          Upcoming Events
        </h3>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
          event
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-label-sm text-on-surface-variant">
          No upcoming events.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const { month, day } = parseDateParts(event.startsAt);
            return (
              <div
                key={event.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex-shrink-0 w-12 text-center bg-surface-container rounded-lg py-2 group-hover:bg-primary transition-colors">
                  <div className="text-[10px] font-bold uppercase text-on-surface-variant group-hover:text-white transition-colors">
                    {month}
                  </div>
                  <div className="text-xl font-bold text-primary group-hover:text-white leading-tight transition-colors">
                    {day}
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="font-label-md text-label-md text-primary truncate">
                    {event.title}
                  </p>
                  <p className="text-label-sm text-on-surface-variant truncate flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">
                      place
                    </span>
                    {event.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {events.length > 0 && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 text-action-blue font-label-md text-sm hover:underline text-center"
        >
          View All Events
        </button>
      )}
    </section>
  );
}
