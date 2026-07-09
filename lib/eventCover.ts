import type { CSSProperties } from "react";

// Deterministic, network-free default cover for events without an uploaded image.
// Seeded by the event id so each event gets a stable, distinct gradient.

const GRADIENTS = [
  "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
  "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
  "linear-gradient(135deg, #059669 0%, #84cc16 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
  "linear-gradient(135deg, #334155 0%, #64748b 100%)",
  "linear-gradient(135deg, #d97706 0%, #facc15 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function defaultEventCoverStyle(seed: string): CSSProperties {
  return { backgroundImage: GRADIENTS[hash(seed) % GRADIENTS.length] };
}