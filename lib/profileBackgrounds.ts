import type { CSSProperties } from "react";


export interface ProfileBackground {
  id: string;
  label: string;
  /** Background applied to the profile hero banner. */
  style: CSSProperties;
}

export const PROFILE_BACKGROUNDS: ProfileBackground[] = [
  {
    id: "default",
    label: "Default",
    style: {
      backgroundColor: "#f0f4ff",
      backgroundImage:
        "radial-gradient(at 0% 0%, #dde1ff 0, transparent 55%), radial-gradient(at 80% 0%, #c7d7ff 0, transparent 50%), radial-gradient(at 50% 100%, #e2e8f0 0, transparent 60%)",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    style: { backgroundImage: "linear-gradient(120deg, #2563eb 0%, #06b6d4 100%)" },
  },
  {
    id: "sunset",
    label: "Sunset",
    style: { backgroundImage: "linear-gradient(120deg, #f97316 0%, #ec4899 100%)" },
  },
  {
    id: "forest",
    label: "Forest",
    style: { backgroundImage: "linear-gradient(120deg, #059669 0%, #84cc16 100%)" },
  },
  {
    id: "lavender",
    label: "Lavender",
    style: { backgroundImage: "linear-gradient(120deg, #8b5cf6 0%, #d946ef 100%)" },
  },
  {
    id: "rose",
    label: "Rose",
    style: { backgroundImage: "linear-gradient(120deg, #f43f5e 0%, #fb7185 100%)" },
  },
  {
    id: "slate",
    label: "Slate",
    style: { backgroundImage: "linear-gradient(120deg, #334155 0%, #64748b 100%)" },
  },
  {
    id: "gold",
    label: "Gold",
    style: { backgroundImage: "linear-gradient(120deg, #d97706 0%, #facc15 100%)" },
  },
];

export const DEFAULT_BACKGROUND_ID = "default";


export function resolveBackgroundStyle(value: string | null | undefined): CSSProperties {
  if (value && /^https?:\/\//.test(value)) {
    return { backgroundImage: `url(${value})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const preset = PROFILE_BACKGROUNDS.find((b) => b.id === value);
  return (preset ?? PROFILE_BACKGROUNDS[0]).style;
}