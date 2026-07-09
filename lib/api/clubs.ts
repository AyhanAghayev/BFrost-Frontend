import { api } from "./client";
import type { Club, ClubCategory } from "@/lib/types";


export interface ApiClub {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  isPublic: boolean;
  category: string;
  status: "PENDING" | "APPROVED";
  coverImageUrl: string | null;
  logoUrl: string | null;
  tags: string[];
  memberCount: number;
  isMember: boolean;
  memberRole: "OWNER" | "MODERATOR" | "MEMBER" | null;
  hasPendingRequest: boolean;
  createdAt: string;
}

export interface ApiMember {
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  role: "OWNER" | "MODERATOR" | "MEMBER";
  joinedAt: string;
}


function mapRole(role: string | null) {
  if (role === "OWNER") return "owner" as const;
  if (role === "MODERATOR") return "moderator" as const;
  if (role === "MEMBER") return "member" as const;
  return "guest" as const;
}

export function mapClub(c: ApiClub): Club {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    coverImageUrl: c.coverImageUrl ?? `https://picsum.photos/seed/${c.slug}/800/400`,
    logoUrl: c.logoUrl,
    category: (c.category as ClubCategory) ?? "Academic",
    university: "",
    memberCount: c.memberCount,
    eventCount: 0,
    articleCount: 0,
    isPublic: c.isPublic,
    status: c.status,
    currentUserRole: mapRole(c.memberRole),
    isMember: c.isMember,
    hasPendingRequest: c.hasPendingRequest ?? false,
    createdAt: c.createdAt,
    moderators: [],
    tags: c.tags ?? [],
  };
}


export async function listClubs(): Promise<Club[]> {
  const results = await api.get<ApiClub[]>("/api/v1/clubs");
  return results.map(mapClub);
}

export async function getClub(slug: string): Promise<Club> {
  const c = await api.get<ApiClub>(`/api/v1/clubs/${slug}`);
  return mapClub(c);
}

export async function searchClubs(q: string): Promise<Club[]> {
  const results = await api.get<ApiClub[]>(`/api/v1/clubs/search?q=${encodeURIComponent(q)}`);
  return results.map(mapClub);
}

export async function createClub(payload: {
  name: string;
  slug: string;
  description?: string;
  category: string;
  isPublic: boolean;
  tags?: string[];
}): Promise<Club> {
  const c = await api.post<ApiClub>("/api/v1/clubs", payload);
  return mapClub(c);
}

export async function updateClub(idOrSlug: string, payload: {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string[];
  coverImageUrl?: string;
  logoUrl?: string;
}): Promise<Club> {
  const c = await api.patch<ApiClub>(`/api/v1/clubs/${idOrSlug}`, payload);
  return mapClub(c);
}

export type JoinResult = "JOINED" | "REQUESTED";

export async function joinClub(clubId: string): Promise<JoinResult> {
  const res = await api.post<{ status: JoinResult }>(`/api/v1/clubs/${clubId}/join`);
  return res.status;
}

export async function leaveClub(clubId: string): Promise<void> {
  return api.delete<void>(`/api/v1/clubs/${clubId}/join`);
}

export async function getClubMembers(clubId: string): Promise<ApiMember[]> {
  return api.get<ApiMember[]>(`/api/v1/clubs/${clubId}/members`);
}

export interface ApiJoinRequest {
  requestId: string;
  userId: string;
  username: string;
  displayName: string;
  profilePictureUrl: string | null;
  createdAt: string;
}

export async function getClubRequests(clubId: string): Promise<ApiJoinRequest[]> {
  return api.get<ApiJoinRequest[]>(`/api/v1/clubs/${clubId}/requests`);
}

export async function approveClubRequest(clubId: string, requestId: string): Promise<void> {
  return api.post<void>(`/api/v1/clubs/${clubId}/requests/${requestId}/approve`);
}

export async function rejectClubRequest(clubId: string, requestId: string): Promise<void> {
  return api.post<void>(`/api/v1/clubs/${clubId}/requests/${requestId}/reject`);
}

export async function setMemberRole(
  clubId: string,
  userId: string,
  role: "MODERATOR" | "MEMBER"
): Promise<void> {
  return api.patch<void>(`/api/v1/clubs/${clubId}/members/${userId}/role`, { role });
}

export async function removeMember(clubId: string, userId: string): Promise<void> {
  return api.delete<void>(`/api/v1/clubs/${clubId}/members/${userId}`);
}

export async function transferOwnership(clubId: string, userId: string): Promise<void> {
  return api.post<void>(`/api/v1/clubs/${clubId}/transfer/${userId}`);
}
