"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { searchClubs } from "@/lib/api/clubs";
import { searchUsers } from "@/lib/api/users";
import type { Club, User, Post } from "@/lib/types";

const CATEGORY_ICON: Record<string, string> = {
  Technology: "computer",
  Arts: "palette",
  Business: "business_center",
  Academic: "school",
  Volunteering: "volunteer_activism",
  Gaming: "sports_esports",
};

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";

  const [localQuery, setLocalQuery] = useState(q);
  const [rawClubs, setRawClubs] = useState<Club[]>([]);
  const [rawUsers, setRawUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setRawClubs([]); setRawUsers([]); return; }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      Promise.all([searchClubs(q), searchUsers(q)])
        .then(([clubs, users]) => { setRawClubs(clubs); setRawUsers(users); })
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  const allClubs = rawClubs;
  const allUsers = rawUsers;
  const allPosts: Post[] = [];
  const hasResults = allClubs.length + allUsers.length + allPosts.length > 0;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (localQuery.trim()) router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
  }

  return (
    <div className="flex-1 min-w-0 min-h-screen bg-surface-faint">
      {/* Mobile search bar */}
      <div className="sm:hidden px-margin-mobile pt-4 pb-2">
        <form onSubmit={handleSearch} className="flex items-center bg-white border border-border-subtle rounded-xl px-4 py-2.5 gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
            placeholder="Search BFrost"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(""); router.push("/search"); }}
              className="material-symbols-outlined text-on-surface-variant text-[18px]"
            >
              close
            </button>
          )}
        </form>
      </div>

      <div className="px-margin-mobile md:px-gutter py-gutter max-w-[1280px] mx-auto">
        {/* Heading */}
        <div className="mb-gutter">
          {q ? (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Results for <span className="text-action-blue">&quot;{q}&quot;</span>
            </h1>
          ) : (
            <h1 className="font-headline-lg text-headline-lg text-primary mb-4 md:mb-gutter">
              Explore BFrost
            </h1>
          )}
        </div>

        <div className="flex flex-col gap-gutter">
          {!hasResults && q && (
            <div className="bg-white border border-border-subtle rounded-xl py-16 flex flex-col items-center gap-3 text-center px-8">
              <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-30">search_off</span>
              <p className="font-label-md text-on-surface">No results for &quot;{q}&quot;</p>
              <p className="text-sm text-on-surface-variant">Try different keywords.</p>
            </div>
          )}

          {/* Clubs section */}
          {allClubs.length > 0 && (
            <section>
              <SectionHeader title="Clubs" count={allClubs.length} showViewAll={false} onViewAll={() => {}} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
                {allClubs.map((club) => (
                  <ClubCard key={club.id} club={club} />
                ))}
              </div>
            </section>
          )}

          {/* People section */}
          {allUsers.length > 0 && (
            <section>
              <SectionHeader title="People" count={allUsers.length} showViewAll={false} onViewAll={() => {}} />
              <div className="flex flex-col gap-stack-sm">
                {allUsers.map((user) => (
                  <PersonRow key={user.id} user={user} />
                ))}
              </div>
            </section>
          )}

          {/* Posts section */}
          {allPosts.length > 0 && (
            <section>
              <SectionHeader title="Posts" count={allPosts.length} showViewAll={false} onViewAll={() => {}} />
              <div className="flex flex-col gap-stack-md">
                {allPosts.map((post) => (
                  <PostRow key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  showViewAll,
  onViewAll,
}: {
  title: string;
  count: number;
  showViewAll: boolean;
  onViewAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-stack-md">
      <div className="flex items-center gap-2">
        <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
        <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      {showViewAll && (
        <button
          onClick={onViewAll}
          className="text-action-blue font-label-md text-label-md hover:underline"
        >
          View all
        </button>
      )}
    </div>
  );
}

function ClubCard({ club }: { club: Club }) {
  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="bg-white border border-border-subtle rounded-xl p-stack-md hover:shadow-md transition-shadow group flex gap-stack-md"
    >
      <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-primary text-[28px]">
            {CATEGORY_ICON[club.category] ?? "hub"}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-label-md text-primary group-hover:text-action-blue transition-colors truncate">
          {club.name}
        </h3>
        <p className="text-label-sm text-on-surface-variant mt-0.5">
          {formatCount(club.memberCount)} members · {club.category}
        </p>
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
          {club.description}
        </p>
      </div>
    </Link>
  );
}

function PersonRow({ user }: { user: User }) {
  const [following, setFollowing] = useState(user.isFollowing);

  return (
    <div className="flex items-center justify-between bg-white border border-border-subtle rounded-xl px-stack-md py-3">
      <Link href={`/profile/${user.username}`} className="flex items-center gap-stack-md group">
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="w-11 h-11 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="font-label-md text-primary group-hover:text-action-blue transition-colors">
              {user.displayName}
            </p>
            {user.isVerified && (
              <span
                className="material-symbols-outlined text-action-blue text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            )}
          </div>
          <p className="text-label-sm text-on-surface-variant">
            {user.department} · {user.university}
          </p>
        </div>
      </Link>
      <button
        onClick={() => setFollowing((p) => !p)}
        className={cn(
          "px-4 py-1.5 rounded-lg text-label-sm font-semibold transition-colors flex-shrink-0",
          following
            ? "bg-surface-container text-on-surface-variant border border-border-subtle"
            : "border-2 border-action-blue text-action-blue hover:bg-action-blue/5"
        )}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

function PostRow({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  return (
    <article className="bg-white border border-border-subtle rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-stack-md">
        {/* Author row */}
        <div className="flex items-center gap-stack-sm mb-stack-md">
          <img
            src={post.author.avatarUrl}
            alt={post.author.displayName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div>
            <p className="text-label-sm text-primary">
              <span className="font-semibold">{post.author.displayName}</span>
              <span className="text-on-surface-variant font-normal"> in </span>
              <Link href={`/clubs/${post.clubId}`} className="text-action-blue hover:underline">
                {post.clubName}
              </Link>
            </p>
            <p className="text-[10px] text-on-surface-variant">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        <Link href={`/posts/${post.id}`}>
          <h3 className="font-headline-md text-headline-md text-primary mb-stack-sm leading-snug hover:text-action-blue transition-colors">
            {post.title}
          </h3>
          <p className="text-on-surface-variant text-sm line-clamp-2 mb-stack-md leading-relaxed">
            {post.body}
          </p>
        </Link>

        {post.imageUrl && (
          <div className="rounded-lg overflow-hidden mb-stack-md border border-border-subtle">
            <img src={post.imageUrl} alt="" className="w-full h-40 object-cover" />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-gutter border-t border-border-subtle pt-stack-md">
          <button
            onClick={() => {
              setLiked((p) => !p);
              setLikeCount((p) => (liked ? p - 1 : p + 1));
            }}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-action-blue" : "text-on-surface-variant hover:text-action-blue"
            )}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              thumb_up
            </span>
            <span className="text-label-sm">{formatCount(likeCount)}</span>
          </button>
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-action-blue transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
            <span className="text-label-sm">{formatCount(post.commentCount)}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
