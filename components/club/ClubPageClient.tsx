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

function ModerationStatsCard({
  stats,
  clubId,
}: {
  stats: { pendingRequests: number; openReports: number };
  clubId: string;
}) {
  return (
    <section className="bg-primary rounded-xl p-stack-md">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-white text-[20px]">
          shield
        </span>
        <h3 className="font-label-md text-label-md uppercase tracking-wider text-white">
          Network Oversight
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {stats.pendingRequests}
          </div>
          <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">
            Requests
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {stats.openReports}
          </div>
          <div className="text-[10px] text-white/70 uppercase tracking-wider mt-1">
            Reports
          </div>
        </div>
      </div>
      <Link
        href={`/clubs/${clubId}/settings`}
        className="block w-full text-center bg-white/20 hover:bg-white/30 text-white rounded-lg py-2.5 font-label-md text-label-md transition-colors"
      >
        Admin Dashboard
      </Link>
    </section>
  );
}

function ResourcesTab({ articles }: { articles: WikiArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="bg-white border border-border-subtle rounded-xl p-gutter text-center text-on-surface-variant">
        No articles yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      {articles.map((article) => (
        <article
          key={article.id}
          className="bg-white border border-border-subtle rounded-xl p-gutter hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-headline-md text-headline-md text-primary mb-2">
                {article.title}
              </h2>
              <p className="text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
                {article.summary}
              </p>
              <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                <img
                  src={article.author.avatarUrl}
                  alt={article.author.displayName}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>{article.author.displayName}</span>
                <span>•</span>
                <span>Updated {formatRelativeTime(article.updatedAt)}</span>
              </div>
            </div>
            {article.isFeatured && (
              <span className="flex-shrink-0 bg-primary text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded font-bold">
                Featured
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

const FORMAT_ICON: Record<string, string> = {
  "in-person": "place",
  online: "videocam",
  hybrid: "devices",
};

function EventsTab({ events }: { events: ClubEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white border border-border-subtle rounded-xl p-gutter text-center text-on-surface-variant">
        No events scheduled for this club.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      {events.map((event) => {
        const d = new Date(event.startsAt);
        const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
        const day = String(d.getDate());
        const time = d.toLocaleString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        return (
          <article
            key={event.id}
            className="bg-white border border-border-subtle rounded-xl p-gutter hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="flex gap-gutter">
              <div className="flex-shrink-0 w-16 text-center bg-primary/10 rounded-xl py-3">
                <div className="text-[10px] font-bold uppercase text-primary">
                  {month}
                </div>
                <div className="text-2xl font-bold text-primary leading-tight">
                  {day}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-headline-md text-headline-md text-primary mb-1">
                  {event.title}
                </h2>
                <p className="text-on-surface-variant leading-relaxed line-clamp-2 mb-3">
                  {event.description}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {FORMAT_ICON[event.format] ?? "place"}
                    </span>
                    {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      schedule
                    </span>
                    {time}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      group
                    </span>
                    {event.attendeeCount} attending
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const ROLE_META: Record<ApiMember["role"], { label: string; cls: string }> = {
  OWNER: { label: "Owner", cls: "bg-primary text-white" },
  MODERATOR: { label: "Moderator", cls: "bg-action-blue text-white" },
  MEMBER: { label: "Member", cls: "bg-surface-container-high text-on-surface-variant" },
};

const ROLE_ORDER: Record<ApiMember["role"], number> = { OWNER: 0, MODERATOR: 1, MEMBER: 2 };

function DirectoryTab({ club }: { club: Club }) {
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getClubMembers(club.id)
      .then((m) =>
        setMembers(
          [...m].sort(
            (a, b) =>
              ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
              a.displayName.localeCompare(b.displayName)
          )
        )
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [club.id]);

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-gutter">
      <div className="flex items-baseline justify-between mb-stack-md">
        <h2 className="font-headline-md text-headline-md text-primary">Members</h2>
        <span className="text-label-sm text-on-surface-variant">
          {formatCount(club.memberCount)} total
        </span>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-on-surface-variant text-body-sm py-8 text-center">{error}</p>
      ) : members.length === 0 ? (
        <p className="text-on-surface-variant text-body-sm py-8 text-center">No members yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {members.map((m) => {
            const meta = ROLE_META[m.role];
            return (
              <Link
                key={m.userId}
                href={`/profile/${m.username}`}
                className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-surface-faint transition-colors"
              >
                <img
                  src={
                    m.profilePictureUrl ??
                    `https://api.dicebear.com/9.x/avataaars/svg?seed=${m.username}`
                  }
                  alt={m.displayName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-label-md text-label-md text-on-surface block truncate">
                    {m.displayName}
                  </span>
                  <span className="text-label-sm text-on-surface-variant truncate">
                    @{m.username}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase",
                    meta.cls
                  )}
                >
                  {meta.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
