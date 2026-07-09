import { api } from "./client";
import type { User } from "@/lib/types";

// ── Backend response shapes ───────────────────────────────────────────────────

export interface AuthResponse {
  userId: string;
  username: string;
  displayName: string;
}

export interface ApiUserProfile {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  bio: string | null;
  profilePictureUrl: string | null;
  backgroundUrl: string | null;
  university: string | null;
  department: string | null;
  verified: boolean;
  role: string;
  followerCount: number;
  followingCount: number;
  isFollowedByCurrentUser: boolean;
  createdAt: string;
}


export function mapUser(u: ApiUserProfile): User {
  return {
    id: u.id,
    username: u.username,
    email: u.email ?? undefined,
    displayName: u.displayName,
    avatarUrl: u.profilePictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${u.username}`,
    backgroundUrl: u.backgroundUrl,
    bio: u.bio ?? "",
    university: u.university ?? "",
    department: u.department ?? "",
    joinedAt: u.createdAt,
    followerCount: u.followerCount,
    followingCount: u.followingCount,
    clubCount: 0,
    isFollowing: u.isFollowedByCurrentUser,
    isVerified: u.verified,
    role: u.role,
  };
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  return api.post<AuthResponse>("/api/v1/auth/register", payload);
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return api.post<AuthResponse>("/api/v1/auth/login", payload);
}

export async function logout(): Promise<void> {
  return api.post<void>("/api/v1/auth/logout");
}

export async function getMe(): Promise<User> {
  const profile = await api.get<ApiUserProfile>("/api/v1/users/me");
  return mapUser(profile);
}