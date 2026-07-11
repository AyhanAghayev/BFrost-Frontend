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

  const [form, setForm] = useState({
    name: club.name,
    slug: club.slug,
    description: club.description,
    category: club.category as ClubCategory,
    tags: club.tags.join(", "),
  });

  const [isPublic, setIsPublic] = useState(club.isPublic);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(club.coverImageUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const [requests, setRequests] = useState<ApiJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [members, setMembers] = useState<ApiMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);

  useEffect(() => {
    getClubRequests(club.id)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setRequestsLoading(false));
    getClubMembers(club.id)
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [club.id]);

  async function changeRole(userId: string, role: "MODERATOR" | "MEMBER") {
    setMemberBusyId(userId);
    try {
      await setMemberRole(club.id, userId, role);
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
    } catch {
      /* keep prior state on failure */
    } finally {
      setMemberBusyId(null);
    }
  }

  async function kickMember(userId: string) {
    setMemberBusyId(userId);
    try {
      await removeMember(club.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      /* ignore */
    } finally {
      setMemberBusyId(null);
    }
  }

  async function handleTransfer(userId: string) {
    if (!confirm("Transfer ownership? You will become a moderator and cannot undo this.")) return;
    setMemberBusyId(userId);
    try {
      await transferOwnership(club.id, userId);
      setMembers((prev) =>
        prev.map((m) => {
          if (m.userId === userId) return { ...m, role: "OWNER" };
          if (m.userId === currentUserId) return { ...m, role: "MODERATOR" };
          return m;
        })
      );
    } catch {
      /* ignore */
    } finally {
      setMemberBusyId(null);
    }
  }

  async function handleRequest(requestId: string, action: "approve" | "reject") {
    setActioningId(requestId);
    try {
      if (action === "approve") await approveClubRequest(club.id, requestId);
      else await rejectClubRequest(club.id, requestId);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
    } catch {
      // leave the request in the list if the action failed
    } finally {
      setActioningId(null);
    }
  }


  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingCover(true);
    try {
      setCoverImageUrl(await uploadImage("clubs", file));
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateClub(club.id, {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        category: form.category,
        isPublic,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        coverImageUrl: coverImageUrl ?? undefined,
      });
      setSaveMsg({ ok: true, text: "Changes saved." });
      // Slug may have changed — keep the URL in sync.
      if (updated.slug !== club.slug) {
        router.replace(`/clubs/${updated.slug}/settings`);
      }
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }


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
          {tab === "general" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">
                  General
                </h2>
                <div className="flex items-center gap-3">
                  {saveMsg && (
                    <span className={cn("text-sm", saveMsg.ok ? "text-emerald-600" : "text-error")}>
                      {saveMsg.text}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>

              <div className="p-gutter space-y-stack-lg">
                {/* Cover image */}
                <Field label="Cover image">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCover}
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="relative group block h-36 w-full rounded-xl border-2 border-dashed border-border-subtle overflow-hidden hover:border-primary transition-colors bg-surface-faint disabled:cursor-wait"
                  >
                    {coverImageUrl && (
                      <img
                        src={coverImageUrl}
                        alt="Cover"
                        className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                      />
                    )}
                    <div
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity z-10",
                        uploadingCover ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        {uploadingCover ? "hourglass_empty" : "add_photo_alternate"}
                      </span>
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        {uploadingCover ? "Uploading…" : "Replace banner"}
                      </span>
                    </div>
                  </button>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <Field label="Club name">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>

                  <Field label="URL slug">
                    <div className="flex items-center bg-surface-faint border border-border-subtle rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-action-blue transition-all">
                      <span className="px-3 py-3 text-sm text-on-surface-variant select-none whitespace-nowrap border-r border-border-subtle bg-surface-container-low">
                        /clubs/
                      </span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, slug: e.target.value }))
                        }
                        className="flex-1 px-3 py-3 bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className={cn(inputCls, "resize-none")}
                      />
                    </Field>
                  </div>

                  <Field label="Category">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          category: e.target.value as ClubCategory,
                        }))
                      }
                      className={inputCls}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tags">
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, tags: e.target.value }))
                      }
                      placeholder="e.g. robotics, ai, hardware"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === "visibility" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">
                  Visibility
                </h2>
                <div className="flex items-center gap-3">
                  {saveMsg && (
                    <span className={cn("text-sm", saveMsg.ok ? "text-emerald-600" : "text-error")}>
                      {saveMsg.text}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
              <div className="p-gutter space-y-stack-md">
                {[
                  {
                    value: true,
                    label: "Public",
                    desc: "Anyone on BFrost can see content and members.",
                    icon: "public",
                  },
                  {
                    value: false,
                    label: "Private",
                    desc: "Only approved members see content. Hidden from search.",
                    icon: "lock",
                  },
                ].map((opt) => {
                  const selected = isPublic === opt.value;
                  return (
                    <label
                      key={String(opt.value)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                        selected
                          ? "border-action-blue bg-action-blue/[0.04]"
                          : "border-border-subtle hover:border-action-blue/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="club-visibility"
                        checked={selected}
                        onChange={() => setIsPublic(opt.value)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "material-symbols-outlined text-[22px] mt-0.5 flex-shrink-0",
                          selected
                            ? "text-action-blue"
                            : "text-on-surface-variant"
                        )}
                      >
                        {opt.icon}
                      </span>
                      <div>
                        <p
                          className={cn(
                            "font-label-md",
                            selected ? "text-action-blue" : "text-on-surface"
                          )}
                        >
                          {opt.label}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Moderation */}
          {tab === "moderation" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">
                  Moderation
                </h2>
              </div>
              <div className="p-gutter">
                <div className="flex items-center justify-between mb-stack-md">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Pending join requests
                  </p>
                  {requests.length > 0 && (
                    <span className="bg-primary text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                      {requests.length}
                    </span>
                  )}
                </div>

                {requestsLoading ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-[40px] opacity-30 mb-3">
                      inbox
                    </span>
                    <p className="text-sm text-on-surface-variant">
                      No pending requests.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {requests.map((r) => {
                      const busy = actioningId === r.requestId;
                      return (
                        <div
                          key={r.requestId}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                r.profilePictureUrl ??
                                `https://api.dicebear.com/9.x/avataaars/svg?seed=${r.username}`
                              }
                              alt={r.displayName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-label-md text-on-surface truncate">
                                {r.displayName}
                              </p>
                              <p className="text-sm text-on-surface-variant truncate">
                                @{r.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleRequest(r.requestId, "reject")}
                              disabled={busy}
                              className="px-3 py-1.5 text-sm text-error border border-red-200 rounded-lg hover:bg-red-50 font-label-md transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleRequest(r.requestId, "approve")}
                              disabled={busy}
                              className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 font-label-md transition-opacity disabled:opacity-50"
                            >
                              {busy ? "…" : "Approve"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team */}
          {tab === "team" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">Team</h2>
                <span className="text-sm text-on-surface-variant">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </span>
              </div>

              {membersLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {members.map((m) => {
                    const isSelf = m.userId === currentUserId;
                    const busy = memberBusyId === m.userId;
                    const roleLabel =
                      m.role === "OWNER" ? "Owner" : m.role === "MODERATOR" ? "Moderator" : "Member";
                    return (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between gap-3 px-gutter py-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              m.profilePictureUrl ??
                              `https://api.dicebear.com/9.x/avataaars/svg?seed=${m.username}`
                            }
                            alt={m.displayName}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-label-md text-on-surface truncate">
                              {m.displayName} {isSelf && <span className="text-on-surface-variant">(you)</span>}
                            </p>
                            <p
                              className={cn(
                                "text-[11px] font-bold uppercase tracking-tight",
                                m.role === "OWNER" ? "text-primary" : "text-on-surface-variant"
                              )}
                            >
                              {roleLabel}
                            </p>
                          </div>
                        </div>

                        {/* Actions — owners manage everyone but themselves; the owner row has none */}
                        {m.role !== "OWNER" && !isSelf && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isOwner && m.role === "MEMBER" && (
                              <button
                                onClick={() => changeRole(m.userId, "MODERATOR")}
                                disabled={busy}
                                className="px-3 py-1.5 text-sm text-action-blue border border-action-blue/30 rounded-lg hover:bg-action-blue/5 font-label-md transition-colors disabled:opacity-50"
                              >
                                Make mod
                              </button>
                            )}
                            {isOwner && m.role === "MODERATOR" && (
                              <button
                                onClick={() => changeRole(m.userId, "MEMBER")}
                                disabled={busy}
                                className="px-3 py-1.5 text-sm text-on-surface-variant border border-border-subtle rounded-lg hover:bg-surface-container-low font-label-md transition-colors disabled:opacity-50"
                              >
                                Remove mod
                              </button>
                            )}
                            {isOwner && (
                              <button
                                onClick={() => handleTransfer(m.userId)}
                                disabled={busy}
                                title="Transfer ownership"
                                className="px-3 py-1.5 text-sm text-on-surface-variant border border-border-subtle rounded-lg hover:bg-surface-container-low font-label-md transition-colors disabled:opacity-50"
                              >
                                Make owner
                              </button>
                            )}
                            <button
                              onClick={() => kickMember(m.userId)}
                              disabled={busy}
                              className="px-3 py-1.5 text-sm text-error border border-red-200 rounded-lg hover:bg-red-50 font-label-md transition-colors disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
