import { api } from "./client";
import { mapUser, type ApiUserProfile } from "./auth";
import type { User } from "@/lib/types";

export async function getUserProfile(username: string): Promise<User> {
  const u = await api.get<ApiUserProfile>(`/api/v1/users/${username}`);
  return mapUser(u);
}

export async function updateProfile(userId: string, payload: {
  username?: string;
  displayName?: string;
  bio?: string;
  profilePictureUrl?: string;
  backgroundUrl?: string;
  university?: string;
  department?: string;
}): Promise<User> {
  const u = await api.patch<ApiUserProfile>(`/api/v1/users/${userId}`, payload);
  return mapUser(u);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return api.post<void>("/api/v1/users/me/password", { currentPassword, newPassword });
}

export async function changeEmail(newEmail: string, currentPassword: string): Promise<void> {
  return api.post<void>("/api/v1/users/me/email", { newEmail, currentPassword });
}

export async function deleteAccount(currentPassword: string): Promise<void> {
  return api.delete<void>("/api/v1/users/me", { currentPassword });
}

export interface NotificationPrefs {
  follow: boolean;
  like: boolean;
  comment: boolean;
  joinRequest: boolean;
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return api.get<NotificationPrefs>("/api/v1/users/me/notification-preferences");
}

export async function updateNotificationPrefs(
  patch: Partial<NotificationPrefs>
): Promise<NotificationPrefs> {
  return api.patch<NotificationPrefs>("/api/v1/users/me/notification-preferences", patch);
}

export async function followUser(userId: string): Promise<void> {
  return api.post<void>(`/api/v1/users/${userId}/follow`);
}

export async function unfollowUser(userId: string): Promise<void> {
  return api.delete<void>(`/api/v1/users/${userId}/follow`);
}

export async function searchUsers(q: string): Promise<User[]> {
  const results = await api.get<ApiUserProfile[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`);
  return results.map(mapUser);
}

export async function getFriends(): Promise<User[]> {
  const results = await api.get<ApiUserProfile[]>("/api/v1/users/me/friends");
  return results.map(mapUser);
}

export async function getFollowers(userId: string): Promise<User[]> {
  const results = await api.get<ApiUserProfile[]>(`/api/v1/users/${userId}/followers`);
  return results.map(mapUser);
}

export async function getFollowing(userId: string): Promise<User[]> {
  const results = await api.get<ApiUserProfile[]>(`/api/v1/users/${userId}/following`);
  return results.map(mapUser);
}
