import { api } from "./client";
import { mapClub, type ApiClub } from "./clubs";
import type { Club } from "@/lib/types";

export interface AdminStats {
  users: number;
  clubsTotal: number;
  clubsApproved: number;
  clubsPending: number;
  posts: number;
  events: number;
  memberships: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  return api.get<AdminStats>("/api/v1/admin/stats");
}

export async function getPendingClubs(): Promise<Club[]> {
  const results = await api.get<ApiClub[]>("/api/v1/admin/clubs/pending");
  return results.map(mapClub);
}

export async function approveClub(clubId: string): Promise<Club> {
  const c = await api.post<ApiClub>(`/api/v1/admin/clubs/${clubId}/approve`);
  return mapClub(c);
}

export async function rejectClub(clubId: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/clubs/${clubId}`);
}
