"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Club, ClubCategory } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  getClub,
  updateClub,
  getClubRequests,
  approveClubRequest,
  rejectClubRequest,
  getClubMembers,
  setMemberRole,
  removeMember,
  transferOwnership,
  type ApiJoinRequest,
  type ApiMember,
} from "@/lib/api/clubs";
import { uploadImage } from "@/lib/api/upload";
import { useAuthStore } from "@/lib/stores/auth.store";

type Tab =
  | "general"
  | "visibility"
  | "moderation"
  | "team"
  | "channels"
  | "danger";

const MAIN_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "general", label: "General", icon: "settings" },
  { id: "visibility", label: "Visibility", icon: "visibility" },
  { id: "moderation", label: "Moderation", icon: "gavel" },
  { id: "team", label: "Team", icon: "badge" },
  { id: "channels", label: "Channels", icon: "tag" },
];

const CATEGORIES: ClubCategory[] = [
  "Technology",
  "Arts",
  "Sports",
  "Science",
  "Business",
  "Social",
  "Cultural",
  "Academic",
  "Volunteering",
  "Gaming",
];

const inputCls =
  "w-full px-4 py-3 bg-surface-faint border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-action-blue transition-all";


export default function ClubSettingsClient({ slug }: { slug: string }) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    getClub(slug)
      .then(setClub)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <div className="animate-pulse space-y-stack-md">
          <div className="h-4 bg-surface-container-high rounded w-1/4" />
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-64 bg-surface-container-high rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">{error ?? "Club not found"}</p>
      </div>
    );
  }

  if (club.currentUserRole !== "owner" && club.currentUserRole !== "moderator") {
    return (
      <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
        <p className="text-on-surface-variant">You don&apos;t have permission to manage this club.</p>
      </div>
    );
  }

  return <SettingsForm club={club} currentUserId={currentUser?.id ?? ""} />;
}

function SettingsForm({
  club,
  currentUserId,
}: {
  club: Club;
  currentUserId: string;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const isOwner = club.currentUserRole === "owner";

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
      {/* Breadcrumb + title */}
      <div className="mb-stack-lg">
        <nav className="flex items-center gap-1 text-sm text-on-surface-variant mb-2">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <Link
            href={`/clubs/${club.slug}`}
            className="hover:text-primary transition-colors"
          >
            {club.name}
          </Link>
          <span className="material-symbols-outlined text-[14px]">
            chevron_right
          </span>
          <span className="text-primary font-semibold">Settings</span>
        </nav>
        <h1 className="font-headline-md text-headline-md text-primary">
          Club settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage {club.name}'s identity, visibility, and team.
        </p>
      </div>

      {/* ── Mobile: horizontal tab bar ── */}
      <div className="flex lg:hidden gap-1 overflow-x-auto pb-1 mb-stack-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {MAIN_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors flex-shrink-0",
                active
                  ? "bg-primary text-white"
                  : "bg-white border border-border-subtle text-on-surface-variant hover:border-primary/30"
              )}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
        {isOwner && (
          <button
            onClick={() => setTab("danger")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors flex-shrink-0",
              tab === "danger"
                ? "bg-error text-white"
                : "bg-white border border-red-200 text-error hover:bg-red-50"
            )}
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Danger zone
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* ── Desktop: left nav ── */}
        <nav className="hidden lg:flex lg:col-span-3 flex-col gap-1 lg:sticky lg:top-20">
          {MAIN_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-stack-md px-4 py-3 rounded-lg font-label-md text-label-md transition-colors text-left w-full",
                  active
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}

          {isOwner && (
            <button
              onClick={() => setTab("danger")}
              className={cn(
                "flex items-center gap-stack-md px-4 py-3 rounded-lg font-label-md text-label-md transition-colors text-left w-full mt-4",
                tab === "danger"
                  ? "bg-error text-white"
                  : "text-error hover:bg-red-50"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                warning
              </span>
              Danger zone
            </button>
          )}
        </nav>

        {/* ── Right content ── */}
        <div className="lg:col-span-9">
          {/* General */}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}