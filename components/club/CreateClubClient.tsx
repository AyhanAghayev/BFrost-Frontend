"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClub } from "@/lib/api/clubs";
import { ApiError } from "@/lib/api/client";
import type { ClubCategory } from "@/lib/types";


type Palette = { id: string; label: string; from: string; to: string };

const PALETTES: Palette[] = [
  { id: "electric", label: "Electric", from: "#0040e0", to: "#2e5bff" },
  { id: "forest",   label: "Forest",   from: "#014d3a", to: "#0a7c5e" },
  { id: "ember",    label: "Ember",    from: "#8b1a00", to: "#c44a00" },
  { id: "cosmic",   label: "Cosmic",   from: "#1a0035", to: "#5c00a3" },
  { id: "dawn",     label: "Dawn",     from: "#001b3d", to: "#44597d" },
  { id: "slate",    label: "Slate",    from: "#1c2434", to: "#3d4a5c" },
];

const CATEGORIES: ClubCategory[] = [
  "Technology", "Arts", "Sports", "Science",
  "Business", "Social", "Cultural", "Academic",
  "Volunteering", "Gaming",
];

const CAT_ICON: Record<ClubCategory, string> = {
  Technology: "terminal", Arts: "palette", Sports: "sports_soccer",
  Science: "science", Business: "trending_up", Social: "groups",
  Cultural: "theater_comedy", Academic: "school",
  Volunteering: "volunteer_activism", Gaming: "videogame_asset",
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const fieldCls =
  "w-full px-4 py-3 bg-surface-faint border border-border-subtle rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-action-blue focus:border-transparent transition-all";

const labelCls = "block text-label-sm font-semibold text-on-surface-variant mb-1.5 tracking-wide uppercase";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-label-sm font-semibold tracking-[0.14em] uppercase text-on-surface-variant whitespace-nowrap">
          {heading}
        </span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
      {children}
    </section>
  );
}

function PreviewCard({
  name, description, category, tags, palette, isPublic,
}: {
  name: string; description: string; category: ClubCategory | "";
  tags: string[]; palette: Palette; isPublic: boolean;
}) {
  const label = name.trim() || "Your club name";
  const hasName = !!name.trim();

  return (
    <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-sm">
      {/* Gradient banner */}
      <div
        className="relative h-28 w-full transition-[background] duration-500 ease-out"
        style={{ background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)` }}
      >
        {/* Floating logo */}
        <div
          className="absolute -bottom-7 left-5 w-14 h-14 rounded-xl border-4 border-surface flex items-center justify-center shadow-md transition-[background] duration-500"
          style={{ background: palette.from }}
        >
          <span
            className={cn(
              "font-bold leading-none transition-all duration-200 select-none",
              hasName ? "text-body-lg text-white" : "text-body-lg text-white/40",
            )}
          >
            {initials(name)}
          </span>
        </div>

        {/* Visibility badge */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full font-medium",
              isPublic
                ? "bg-white/20 text-white backdrop-blur-sm"
                : "bg-black/30 text-white backdrop-blur-sm"
            )}
          >
            <span
              className="material-symbols-outlined text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPublic ? "public" : "lock"}
            </span>
            {isPublic ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="bg-surface pt-10 px-5 pb-5 space-y-2">
        <h3
          className={cn(
            "text-headline-md font-bold leading-tight transition-colors duration-200",
            hasName ? "text-on-surface" : "text-on-surface-variant/30 italic font-normal",
          )}
        >
          {label}
        </h3>

        {category && (
          <p className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">
              {CAT_ICON[category as ClubCategory]}
            </span>
            {category}
          </p>
        )}

        <p
          className={cn(
            "text-body-sm leading-relaxed transition-colors duration-200",
            description.trim()
              ? "text-on-surface-variant"
              : "text-on-surface-variant/30 italic",
          )}
        >
          {description.trim() || "Your club's story begins here…"}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-label-sm px-2.5 py-0.5 bg-surface-container rounded-full text-on-surface-variant"
              >
                #{t}
              </span>
            ))}
            {tags.length > 5 && (
              <span className="text-label-sm text-on-surface-variant/50 self-center">
                +{tags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateClubClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ClubCategory | "">("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [palette, setPalette] = useState(PALETTES[0]);

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    if (!slugLocked) setSlug(slugify(val));
  }, [slugLocked]);

  const handleSlugChange = useCallback((val: string) => {
    setSlugLocked(true);
    setSlug(slugify(val));
    setSlugError(null);
  }, []);

  function commitTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
    if (!t || tags.includes(t) || tags.length >= 8) return;
    setTags((p) => [...p, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((p) => p.filter((x) => x !== t));
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category || !slug) return;
    setSubmitting(true);
    setGlobalError(null);
    setSlugError(null);
    try {
      const club = await createClub({
        name: name.trim(),
        slug,
        description: description.trim() || undefined,
        category,
        isPublic,
        tags: tags.length ? tags : undefined,
      });
      router.push(`/clubs/${club.slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSlugError("That URL is already taken — try another.");
      } else if (err instanceof ApiError) {
        setGlobalError(err.detail);
      } else {
        setGlobalError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length >= 2 && !!category && slug.length >= 2;

  return (
    <div className="flex-1 min-w-0">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {/* Back */}
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-on-surface mb-8 transition-colors group"
        >
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
            arrow_back
          </span>
          All clubs
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight mb-2">
            Found a Club
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Start something that matters at your university.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-x-10 gap-y-8 items-start">

          {/* ── Left: sticky preview ── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <PreviewCard
              name={name}
              description={description}
              category={category}
              tags={tags}
              palette={palette}
              isPublic={isPublic}
            />

            {/* Palette row */}
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-3">
                Club colour
              </p>
              <div className="flex items-center gap-2.5">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p)}
                    title={p.label}
                    aria-label={`${p.label} colour`}
                    aria-pressed={palette.id === p.id}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-action-blue",
                      palette.id === p.id
                        ? "ring-2 ring-offset-2 ring-on-surface/80 scale-[1.15]"
                        : "hover:scale-105 opacity-70 hover:opacity-100",
                    )}
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  />
                ))}
              </div>
            </div>

            <p className="text-label-sm text-on-surface-variant/50 leading-relaxed">
              Upload a cover image and logo from club settings after you&apos;ve created it.
            </p>
          </div>

          {/* ── Right: form ── */}
          <form onSubmit={handleSubmit} className="space-y-10">

            {/* Identity */}
            <Section heading="Identity">
              {/* Name */}
              <div>
                <label htmlFor="cc-name" className={labelCls}>
                  Name <span className="text-error normal-case">*</span>
                </label>
                <input
                  id="cc-name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Robotics & Automation Society"
                  maxLength={80}
                  required
                  className={fieldCls}
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="cc-slug" className={labelCls}>
                  URL <span className="text-error normal-case">*</span>
                </label>
                <div
                  className={cn(
                    "flex items-stretch rounded-xl border bg-surface-faint overflow-hidden",
                    "transition-all focus-within:ring-2 focus-within:ring-action-blue focus-within:border-transparent",
                    slugError ? "border-error" : "border-border-subtle",
                  )}
                >
                  <span className="flex items-center px-3 text-label-sm text-on-surface-variant/50 bg-surface-container border-r border-border-subtle select-none whitespace-nowrap">
                    /clubs/
                  </span>
                  <input
                    id="cc-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="robotics-automation"
                    maxLength={64}
                    required
                    className="flex-1 px-3 py-3 bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
                  />
                </div>
                {slugError && (
                  <p className="mt-1.5 flex items-center gap-1 text-label-sm text-error">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {slugError}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="cc-desc" className={cn(labelCls, "mb-0")}>
                    Description
                  </label>
                  <span className="text-label-sm text-on-surface-variant/40">
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  id="cc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your club do? Who is it for? What makes it worth joining?"
                  maxLength={500}
                  rows={4}
                  className={cn(fieldCls, "resize-none")}
                />
              </div>
            </Section>

            {/* Character */}
            <Section heading="Character">
              {/* Category */}
              <div>
                <label htmlFor="cc-cat" className={labelCls}>
                  Category <span className="text-error normal-case">*</span>
                </label>
                <div className="relative">
                  <select
                    id="cc-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClubCategory)}
                    required
                    className={cn(
                      fieldCls,
                      "appearance-none pr-10",
                      !category && "text-on-surface-variant/40",
                    )}
                  >
                    <option value="" disabled>Pick a category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="cc-tags" className={cn(labelCls, "mb-0")}>Tags</label>
                  <span className="text-label-sm text-on-surface-variant/40">{tags.length}/8</span>
                </div>
                <div
                  className={cn(
                    "flex flex-wrap gap-2 px-3 py-2.5 bg-surface-faint border border-border-subtle rounded-xl",
                    "transition-all focus-within:ring-2 focus-within:ring-action-blue focus-within:border-transparent min-h-[48px]",
                  )}
                >
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-label-sm px-2.5 py-1 bg-primary/10 text-primary rounded-full"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        aria-label={`Remove ${t}`}
                        className="text-primary/60 hover:text-primary transition-colors ml-0.5"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </span>
                  ))}
                  {tags.length < 8 && (
                    <input
                      id="cc-tags"
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={onTagKeyDown}
                      onBlur={() => { if (tagInput.trim()) commitTag(tagInput); }}
                      placeholder={tags.length === 0 ? "Add tags — press Enter or comma…" : ""}
                      className="flex-1 min-w-[140px] bg-transparent text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none py-0.5"
                    />
                  )}
                </div>
                <p className="mt-1.5 text-label-sm text-on-surface-variant/50">
                  Up to 8 tags. Letters, numbers, and hyphens only.
                </p>
              </div>
            </Section>

            {/* Access */}
            <Section heading="Access">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: true,  icon: "public", title: "Public",  desc: "Anyone can find and join your club." },
                  { value: false, icon: "lock",   title: "Private", desc: "Members join by invitation or request." },
                ].map(({ value, icon, title, desc }) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setIsPublic(value)}
                    className={cn(
                      "flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all",
                      isPublic === value
                        ? "border-action-blue bg-action-blue/5"
                        : "border-border-subtle bg-surface-faint hover:bg-surface-container",
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-[22px] mt-0.5 shrink-0",
                        isPublic === value ? "text-action-blue" : "text-on-surface-variant",
                      )}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {icon}
                    </span>
                    <div>
                      <p className={cn(
                        "text-body-sm font-semibold mb-0.5",
                        isPublic === value ? "text-action-blue" : "text-on-surface",
                      )}>
                        {title}
                      </p>
                      <p className="text-label-sm text-on-surface-variant leading-snug">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Global error */}
            {globalError && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-error-container rounded-xl text-body-sm text-on-error-container">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                {globalError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pb-10">
              <Link
                href="/clubs"
                className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-body-sm font-semibold transition-all",
                  canSubmit && !submitting
                    ? "bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98] shadow-sm"
                    : "bg-surface-container text-on-surface-variant cursor-not-allowed",
                )}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin shrink-0" />
                    Founding…
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined text-[18px] shrink-0"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      add_circle
                    </span>
                    Found this club
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
