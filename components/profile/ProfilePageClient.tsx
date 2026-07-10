"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import type { User, Post, WikiArticle } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getUserProfile, followUser, unfollowUser, getFollowers, getFollowing } from "@/lib/api/users";
import { getUserPosts, getSavedPosts } from "@/lib/api/posts";
import { resolveBackgroundStyle } from "@/lib/profileBackgrounds";

type Tab = "posts" | "media" | "wiki" | "saved";

interface ClubEntry {
  id: string;
  name: string;
  role: string;
}

interface MutualUser {
  id: string;
  displayName: string;
  avatarUrl: string;
}

interface Props {
  username: string;
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-primary text-white",
  moderator: "bg-action-blue text-white",
  member: "bg-surface-container-high text-on-surface-variant",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  moderator: "Moderator",
  member: "Member",
};

export default function ProfilePageClient({ username }: Props) {
  const { currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [articles] = useState<WikiArticle[]>([]);
  const [clubEntries] = useState<ClubEntry[]>([]);
  const [mutualUsers] = useState<MutualUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [listModal, setListModal] = useState<null | "followers" | "following">(null);
  const [listUsers, setListUsers] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");

  const isOwnProfile = !!currentUser && currentUser.username === username;

  useEffect(() => {
    if (!isOwnProfile) return;
    setSavedLoading(true);
    getSavedPosts()
      .then(setSavedPosts)
      .catch(() => setSavedPosts([]))
      .finally(() => setSavedLoading(false));
  }, [isOwnProfile, username]);

  useEffect(() => {
    setLoading(true);
    getUserProfile(username)
      .then(async (profileUser) => {
        setUser(profileUser);
        setFollowed(profileUser.isFollowing);
        setFollowerCount(profileUser.followerCount);
        const postsPage = await getUserPosts(profileUser.id);
        setPosts(postsPage.items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  if (loading || !user) {
    return (
      <div className="flex-1 min-w-0 min-h-screen bg-surface-faint animate-pulse">
        <div className="h-48 md:h-64 bg-surface-container" />
        <div className="px-margin-mobile md:px-gutter -mt-16 pb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white border-4 border-white shadow-md" />
          <div className="mt-4 h-6 bg-surface-container rounded w-48 mb-2" />
          <div className="h-4 bg-surface-container rounded w-32" />
        </div>
      </div>
    );
  }

  function toggleFollow() {
    const wasFollowed = followed;
    setFollowerCount((p) => (wasFollowed ? p - 1 : p + 1));
    setFollowed((p) => !p);
    (wasFollowed ? unfollowUser(user!.id) : followUser(user!.id)).catch(() => {
      setFollowerCount((p) => (wasFollowed ? p + 1 : p - 1));
      setFollowed(wasFollowed);
    });
  }

  function openList(kind: "followers" | "following") {
    setListModal(kind);
    setListUsers([]);
    setListLoading(true);
    const fetcher = kind === "followers" ? getFollowers : getFollowing;
    fetcher(user!.id)
      .then(setListUsers)
      .catch(() => setListUsers([]))
      .finally(() => setListLoading(false));
  }

  const mediaPosts = posts.filter((p) => p.imageUrl);

  return (
    <div className="flex-1 min-w-0 min-h-screen bg-surface-faint">
      {/* ── Hero banner ── */}
      <div
        className="h-48 md:h-64 w-full"
        style={resolveBackgroundStyle(user.backgroundUrl)}
      />

      {/* ── Profile header ── */}
      <div className="px-margin-mobile md:px-gutter -mt-16 relative z-10 pb-6 border-b border-border-subtle">
        {/* Row 1: avatar floated up + action buttons pinned top-right */}
        <div className="flex items-end justify-between gap-3">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-white shadow-md overflow-hidden flex-shrink-0 bg-white">
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
          </div>

          {/* Action buttons — always visible, icon+text on sm+, icon-only on xs */}
          <div className="flex gap-2 pb-1 self-end">
            {isOwnProfile ? (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 border border-border-subtle text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span className="hidden sm:inline">Edit Profile</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={toggleFollow}
                  className={cn(
                    "px-4 sm:px-6 py-2.5 rounded-lg font-label-md text-label-md transition-colors",
                    followed
                      ? "border border-border-subtle text-on-surface-variant hover:bg-surface-container"
                      : "bg-primary text-white hover:opacity-90"
                  )}
                >
                  {followed ? "Following" : "Follow"}
                </button>
                <Link
                  href="/chat"
                  className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 border border-border-subtle text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                  <span className="hidden sm:inline">Message</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Row 2: name, handle, stats */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-primary leading-tight">{user.displayName}</h1>
            {user.isVerified && (
              <span
                className="material-symbols-outlined text-action-blue text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            )}
          </div>
          <p className="text-on-surface-variant text-sm mt-0.5">@{user.username}</p>
          <p className="text-on-surface-variant text-sm">{user.department} · {user.university}</p>
          <div className="flex gap-5 mt-2 flex-wrap">
            <button
              onClick={() => openList("followers")}
              className="cursor-pointer text-sm text-on-surface hover:text-action-blue transition-colors"
            >
              <span className="font-semibold">{formatCount(followerCount)}</span>{" "}
              <span className="text-on-surface-variant">Followers</span>
            </button>
            <button
              onClick={() => openList("following")}
              className="cursor-pointer text-sm text-on-surface hover:text-action-blue transition-colors"
            >
              <span className="font-semibold">{formatCount(user.followingCount)}</span>{" "}
              <span className="text-on-surface-variant">Following</span>
            </button>
            <span className="text-sm text-on-surface">
              <span className="font-semibold">{user.clubCount}</span>{" "}
              <span className="text-on-surface-variant">Clubs</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Dashboard grid ── */}
      <div className="px-margin-mobile md:px-gutter py-gutter">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* ── Left sidebar ── */}
          <aside className="lg:col-span-3 flex flex-col gap-gutter">
            {/* About */}
            <section className="bg-white border border-border-subtle rounded-xl p-stack-md shadow-sm">
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-4">
                About
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{user.bio}</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">school</span>
                  <span>{user.university}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">badge</span>
                  <span>{user.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">
                    calendar_today
                  </span>
                  <span>
                    Joined{" "}
                    {new Date(user.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </section>

            {/* Mutual connections — only on other users' profiles */}
            {!isOwnProfile && mutualUsers.length > 0 && (
              <section className="bg-primary-container rounded-xl p-stack-md shadow-sm">
                <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-primary-container/70 mb-4">
                  Mutual Connections
                </h3>
                <div className="flex -space-x-2.5 mb-4">
                  {mutualUsers.slice(0, 3).map((u) => (
                    <img
                      key={u.id}
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-9 h-9 rounded-full border-2 border-primary-container object-cover"
                    />
                  ))}
                  {mutualUsers.length > 3 && (
                    <div className="w-9 h-9 rounded-full border-2 border-primary-container bg-action-blue flex items-center justify-center text-white text-[11px] font-bold">
                      +{mutualUsers.length - 3}
                    </div>
                  )}
                </div>
                <p className="text-sm text-on-primary-container/80 mb-4 leading-relaxed">
                  You both know{" "}
                  <span className="font-semibold text-on-primary-container">
                    {mutualUsers[0].displayName}
                  </span>
                  {mutualUsers.length > 1 && ` and ${mutualUsers.length - 1} other${mutualUsers.length > 2 ? "s" : ""}`}.
                </p>
                <Link
                  href="/chat"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                  Message {user.displayName.split(" ")[0]}
                </Link>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
