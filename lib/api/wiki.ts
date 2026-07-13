import { api } from "./client";
import type { WikiArticle } from "@/lib/types";

interface ApiWikiArticle {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  summary: string | null;
  body: string;
  featured: boolean;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorPictureUrl: string | null;
  canManage: boolean;
  updatedAt: string;
  createdAt: string;
}

function excerpt(body: string): string {
  const text = body.replace(/[#*_`>\-]/g, "").replace(/\s+/g, " ").trim();
  return text.length > 160 ? text.slice(0, 157) + "…" : text;
}

export function mapWikiArticle(a: ApiWikiArticle): WikiArticle {
  return {
    id: a.id,
    clubId: a.clubId,
    clubSlug: a.clubSlug,
    clubName: a.clubName,
    title: a.title,
    summary: a.summary?.trim() || excerpt(a.body),
    body: a.body,
    authorId: a.authorId,
    author: {
      id: a.authorId,
      username: a.authorUsername,
      displayName: a.authorDisplayName,
      avatarUrl: a.authorPictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${a.authorUsername}`,
    },
    updatedAt: a.updatedAt,
    isFeatured: a.featured,
    canManage: a.canManage,
  };
}

export async function getClubWiki(clubSlug: string): Promise<WikiArticle[]> {
  const results = await api.get<ApiWikiArticle[]>(`/api/v1/clubs/${clubSlug}/wiki`);
  return results.map(mapWikiArticle);
}

export async function getWikiArticle(articleId: string): Promise<WikiArticle> {
  const a = await api.get<ApiWikiArticle>(`/api/v1/wiki/${articleId}`);
  return mapWikiArticle(a);
}

export async function getWikiFeed(): Promise<WikiArticle[]> {
  const results = await api.get<ApiWikiArticle[]>("/api/v1/wiki/feed");
  return results.map(mapWikiArticle);
}

export async function getUserWiki(userId: string): Promise<WikiArticle[]> {
  const results = await api.get<ApiWikiArticle[]>(`/api/v1/users/${userId}/wiki`);
  return results.map(mapWikiArticle);
}

export async function createWikiArticle(clubId: string, payload: {
  title: string;
  summary?: string;
  body: string;
  featured?: boolean;
}): Promise<WikiArticle> {
  const a = await api.post<ApiWikiArticle>(`/api/v1/clubs/${clubId}/wiki`, payload);
  return mapWikiArticle(a);
}

export async function updateWikiArticle(articleId: string, payload: {
  title?: string;
  summary?: string;
  body?: string;
  featured?: boolean;
}): Promise<WikiArticle> {
  const a = await api.patch<ApiWikiArticle>(`/api/v1/wiki/${articleId}`, payload);
  return mapWikiArticle(a);
}

export async function deleteWikiArticle(articleId: string): Promise<void> {
  return api.delete<void>(`/api/v1/wiki/${articleId}`);
}

export async function getAiStatus(): Promise<boolean> {
  const res = await api.get<{ enabled: boolean }>("/api/v1/wiki/ai/status");
  return res.enabled;
}

export async function aiDraft(clubId: string, topic: string): Promise<{ summary: string; body: string }> {
  return api.post<{ summary: string; body: string }>(`/api/v1/clubs/${clubId}/wiki/ai-draft`, { topic });
}

export async function aiSummarize(clubId: string, body: string): Promise<string> {
  const res = await api.post<{ summary: string }>(`/api/v1/clubs/${clubId}/wiki/ai-summarize`, { body });
  return res.summary;
}
