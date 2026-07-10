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
