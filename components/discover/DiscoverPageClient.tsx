"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatCount } from "@/lib/utils/format";
import type { Club, ClubCategory } from "@/lib/types";
import { listClubs, joinClub, leaveClub } from "@/lib/api/clubs";

// ── constants ─────────────────────────────────────────────────────────────────

const CAT_ICON: Record<ClubCategory, string> = {
  Technology: "computer",
  Arts: "palette",
  Sports: "sports",
  Science: "science",
  Business: "business_center",
  Social: "diversity_3",
  Cultural: "theater_comedy",
  Academic: "school",
  Volunteering: "volunteer_activism",
  Gaming: "sports_esports",
};

const CAT_COLOR: Record<ClubCategory, string> = {
  Technology: "bg-blue-50 text-blue-700",
  Arts: "bg-purple-50 text-purple-700",
  Sports: "bg-orange-50 text-orange-700",
  Science: "bg-emerald-50 text-emerald-700",
  Business: "bg-amber-50 text-amber-700",
  Social: "bg-pink-50 text-pink-700",
  Cultural: "bg-indigo-50 text-indigo-700",
  Academic: "bg-cyan-50 text-cyan-700",
  Volunteering: "bg-green-50 text-green-700",
  Gaming: "bg-violet-50 text-violet-700",
};

// ── FeaturedCard ──────────────────────────────────────────────────────────────

function FeaturedCard({
  club,
  large,
  joined,
  onJoin,
}: {
  club: Club;
  large: boolean;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const isOwned = club.currentUserRole === "owner" || club.currentUserRole === "moderator";

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className={`relative rounded-2xl overflow-hidden group block ${large ? "h-[240px] sm:h-[300px] md:h-[340px]" : "h-[340px]"}`}
    >
      <img
        src={club.coverImageUrl}
        alt={club.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,27,61,0.92) 0%, rgba(0,27,61,0.3) 55%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6 gap-2">
        {large && (
          <span className="inline-flex items-center gap-1 self-start px-3 py-1 bg-action-blue text-white text-[11px] font-bold tracking-widest uppercase rounded-lg mb-1">
            <span className="material-symbols-outlined text-[13px]">star</span>
            Top club
          </span>
        )}
        <h3
          className={`text-white font-headline-md ${large ? "text-headline-lg" : "text-headline-md"} leading-tight`}
        >
          {club.name}
        </h3>
        {large && (
          <p className="text-white/75 text-body-sm leading-relaxed line-clamp-2 max-w-md">
            {club.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2 text-white/80 text-body-sm">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {formatCount(club.memberCount)} members
          </div>
          {large && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!isOwned) onJoin(club.id);
              }}
              className={`px-5 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                isOwned
                  ? "bg-white/20 text-white cursor-default"
                  : joined
                  ? "bg-white/20 text-white"
                  : "bg-white text-primary hover:bg-white/90"
              }`}
            >
              {isOwned ? "Your club" : joined ? "Joined" : "Explore"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── ClubCard ──────────────────────────────────────────────────────────────────

function ClubCard({
  club,
  joined,
  onJoin,
}: {
  club: Club;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const isOwned = club.currentUserRole === "owner" || club.currentUserRole === "moderator";
  const catCls = CAT_COLOR[club.category] ?? "bg-surface-faint text-on-surface-variant";
  const catIcon = CAT_ICON[club.category] ?? "group";

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-stack-md flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${catCls}`}>
          <span className="material-symbols-outlined text-[28px]">{catIcon}</span>
        </div>
        <span className="text-label-sm text-on-surface-variant">{club.category}</span>
      </div>

      <div>
        <h4 className="font-label-md text-label-md text-on-surface mb-1">{club.name}</h4>
        <p className="text-on-surface-variant text-body-sm line-clamp-2">{club.description}</p>
      </div>

      <div className="flex items-center gap-1 text-on-surface-variant text-body-sm">
        <span className="material-symbols-outlined text-[15px]">group</span>
        <span>{formatCount(club.memberCount)} members</span>
        <span className="mx-1 opacity-40">·</span>
        <span className="material-symbols-outlined text-[15px]">event</span>
        <span>{club.eventCount} events</span>
      </div>

      {isOwned ? (
        <Link
          href={`/clubs/${club.slug}`}
          className="w-full py-2.5 rounded-xl border border-border-subtle text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-surface-faint transition-colors mt-auto"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          {club.currentUserRole === "owner" ? "Manage" : "View"}
        </Link>
      ) : joined ? (
        <button
          onClick={() => onJoin(club.id)}
          className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-red-50 hover:text-error hover:border-red-200 transition-colors mt-auto group"
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <span className="group-hover:hidden">Joined</span>
          <span className="hidden group-hover:inline">Leave</span>
        </button>
      ) : (
        <button
          onClick={() => onJoin(club.id)}
          className="w-full py-2.5 rounded-xl border-2 border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-white transition-colors mt-auto"
        >
          Join club
        </button>
      )}
    </div>
  );
}

// ── RecommendedItem ───────────────────────────────────────────────────────────

function RecommendedItem({
  club,
  joined,
  onJoin,
}: {
  club: Club;
  joined: boolean;
  onJoin: (id: string) => void;
}) {
  const catCls = CAT_COLOR[club.category] ?? "bg-surface-faint text-on-surface-variant";
  const catIcon = CAT_ICON[club.category] ?? "group";

  return (
    <div className="flex items-center gap-3 group hover:bg-white rounded-xl p-2 -mx-2 transition-colors cursor-pointer">
      <Link href={`/clubs/${club.slug}`} className="contents">
        <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${catCls}`}>
          <span className="material-symbols-outlined text-[20px]">{catIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md text-on-surface truncate group-hover:text-action-blue transition-colors">
            {club.name}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {formatCount(club.memberCount)} members
          </p>
        </div>
      </Link>
      <button
        onClick={() => onJoin(club.id)}
        className="shrink-0 text-on-surface-variant hover:text-primary transition-colors"
        title={joined ? "Leave club" : "Join club"}
      >
        <span
          className="material-symbols-outlined text-[24px]"
          style={joined ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {joined ? "check_circle" : "add_circle"}
        </span>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiscoverPageClient() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ClubCategory | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listClubs()
      .then((data) => {
        setClubs(data);
        setJoinedIds(new Set(data.filter((c) => c.isMember).map((c) => c.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [...new Set(clubs.map((c) => c.category))].sort() as ClubCategory[],
    [clubs]
  );

  const featured = clubs.slice(0, 2);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return clubs.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = !activeCategory || c.category === activeCategory;
      return matchQ && matchCat;
    });
  }, [clubs, query, activeCategory]);

  const isFiltering = query.trim() !== "" || activeCategory !== null;

  const recommended = useMemo(
    () => clubs.filter((c) => !joinedIds.has(c.id)).slice(0, 3),
    [clubs, joinedIds]
  );

  return null;
}
