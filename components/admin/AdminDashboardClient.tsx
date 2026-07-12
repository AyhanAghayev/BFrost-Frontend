"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  getAdminStats,
  getPendingClubs,
  approveClub,
  rejectClub,
  type AdminStats,
} from "@/lib/api/admin";
import type { Club } from "@/lib/types";

const STAT_CARDS: { key: keyof AdminStats; label: string; icon: string }[] = [
  { key: "users", label: "Users", icon: "group" },
  { key: "clubsApproved", label: "Active clubs", icon: "workspaces" },
  { key: "clubsPending", label: "Pending clubs", icon: "hourglass_top" },
  { key: "posts", label: "Posts", icon: "article" },
  { key: "events", label: "Events", icon: "event" },
  { key: "memberships", label: "Memberships", icon: "badge" },
];

export default function AdminDashboardClient() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") router.replace("/discover");
  }, [currentUser, router]);

  useEffect(() => {
    Promise.all([getAdminStats(), getPendingClubs()])
      .then(([s, p]) => { setStats(s); setPending(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(club: Club) {
    setBusyId(club.id);
    try {
      await approveClub(club.id);
      setPending((prev) => prev.filter((c) => c.id !== club.id));
      setStats((s) => s && { ...s, clubsPending: s.clubsPending - 1, clubsApproved: s.clubsApproved + 1 });
    } catch {
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(club: Club) {
    if (!confirm(`Reject and delete "${club.name}"? This cannot be undone.`)) return;
    setBusyId(club.id);
    try {
      await rejectClub(club.id);
      setPending((prev) => prev.filter((c) => c.id !== club.id));
      setStats((s) => s && { ...s, clubsPending: s.clubsPending - 1, clubsTotal: s.clubsTotal - 1 });
    } catch {
    } finally {
      setBusyId(null);
    }
  }

  if (currentUser && currentUser.role !== "ADMIN") return null;

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
      <div className="mb-stack-lg">
        <h1 className="font-headline-md text-headline-md text-primary">Admin dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Platform overview and club approvals.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-stack-md mb-stack-lg">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="bg-white border border-border-subtle rounded-xl p-stack-md flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <span className="text-3xl font-bold text-primary font-headline-md">
              {loading || !stats ? "—" : stats[card.key]}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
          <h2 className="font-headline-md text-headline-md text-primary">Clubs awaiting approval</h2>
          {pending.length > 0 && (
            <span className="bg-primary text-white text-[11px] font-bold rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-14 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">
              inbox
            </span>
            <p className="text-sm text-on-surface-variant">No clubs waiting for review.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {pending.map((club) => {
              const busy = busyId === club.id;
              return (
                <div key={club.id} className="flex items-center justify-between gap-3 px-gutter py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0">
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/40">hub</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-on-surface truncate">{club.name}</p>
                      <p className="text-sm text-on-surface-variant truncate">
                        {club.category} · /clubs/{club.slug}
                      </p>
                      {club.description && (
                        <p className="text-sm text-on-surface-variant truncate">{club.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(club)}
                      disabled={busy}
                      className="px-3 py-1.5 text-sm text-error border border-red-200 rounded-lg hover:bg-red-50 font-label-md transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(club)}
                      disabled={busy}
                      className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 font-label-md transition-opacity disabled:opacity-50"
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
  );
}
