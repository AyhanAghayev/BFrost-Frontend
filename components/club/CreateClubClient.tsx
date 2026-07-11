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
      {/* form UI added in the next commit */}
    </div>
  );
}
