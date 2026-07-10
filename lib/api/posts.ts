import { api } from "./client";
import type { Post, Comment, PostType } from "@/lib/types";


export interface ApiPost {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorPictureUrl: string | null;
  targetType: "USER_PAGE" | "CLUB_PAGE";
  targetId: string;
  targetName: string;
  targetSlug: string;
  postType: "TEXT" | "IMAGE" | "LINK" | "QUESTION" | "POLL";
  title: string | null;
  body: string;
  mediaUrl: string | null;
  linkUrl: string | null;
  channel: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  currentUserReaction: "LIKE" | "DISLIKE" | null;
  saved: boolean;
  pollOptions: ApiPollOption[];
  createdAt: string;
}

export interface ApiPollOption {
  id: string;
  optionText: string;
  voteCount: number;
  position: number;
  votedByCurrentUser: boolean;
}

export interface ApiComment {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorPictureUrl: string | null;
  body: string;
  createdAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}


function mapPostType(t: ApiPost["postType"]): PostType {
  switch (t) {
    case "IMAGE": return "image";
    case "LINK": return "link";
    case "QUESTION": return "question";
    case "POLL": return "poll";
    default: return "text";
  }
}

export function mapPost(p: ApiPost): Post {
  return {
    id: p.id,
    authorId: p.authorId,
    author: {
      id: p.authorId,
      username: p.authorUsername,
      displayName: p.authorDisplayName,
      avatarUrl: p.authorPictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.authorUsername}`,
    },
    clubId: p.targetSlug,
    clubName: p.targetName,
    targetKind: p.targetType === "CLUB_PAGE" ? "club" : "user",
    type: mapPostType(p.postType),
    title: p.title ?? "",
    body: p.body,
    imageUrl: p.mediaUrl,
    linkUrl: p.linkUrl,
    channel: p.channel ?? "general",
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    isLiked: p.currentUserReaction === "LIKE",
    isSaved: p.saved,
    createdAt: p.createdAt,
    authorRole: "member",
  };
}

export function mapComment(c: ApiComment): Comment {
  return {
    id: c.id,
    postId: "",
    authorId: c.authorId,
    author: {
      id: c.authorId,
      username: c.authorUsername,
      displayName: c.authorDisplayName,
      avatarUrl: c.authorPictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.authorUsername}`,
    },
    body: c.body,
    likeCount: 0,
    isLiked: false,
    createdAt: c.createdAt,
  };
}


export async function getPost(postId: string): Promise<Post> {
  const p = await api.get<ApiPost>(`/api/v1/posts/${postId}`);
  return mapPost(p);
}

export async function deletePost(postId: string): Promise<void> {
  return api.delete<void>(`/api/v1/posts/${postId}`);
}

export async function getFeed(cursor?: string): Promise<CursorPage<Post>> {
  const q = cursor ? `?cursor=${cursor}` : "";
  const page = await api.get<CursorPage<ApiPost>>(`/api/v1/feed${q}`);
  return { ...page, items: page.items.map(mapPost) };
}

export async function getClubPosts(clubId: string, cursor?: string): Promise<CursorPage<Post>> {
  const q = cursor ? `?cursor=${cursor}` : "";
  const page = await api.get<CursorPage<ApiPost>>(`/api/v1/clubs/${clubId}/posts${q}`);
  return { ...page, items: page.items.map(mapPost) };
}

export async function getUserPosts(userId: string, cursor?: string): Promise<CursorPage<Post>> {
  const q = cursor ? `?cursor=${cursor}` : "";
  const page = await api.get<CursorPage<ApiPost>>(`/api/v1/users/${userId}/posts${q}`);
  return { ...page, items: page.items.map(mapPost) };
}

export async function createPost(payload: {
  targetType: "USER_PAGE" | "CLUB_PAGE";
  targetId: string;
  postType?: "TEXT" | "IMAGE" | "LINK" | "QUESTION" | "POLL";
  title?: string;
  body: string;
  mediaUrl?: string;
  linkUrl?: string;
  channel?: string;
  pollOptions?: string[];
}): Promise<Post> {
  const p = await api.post<ApiPost>("/api/v1/posts", {
    postType: "TEXT",
    ...payload,
  });
  return mapPost(p);
}

export async function reactToPost(postId: string, type: "LIKE" | "DISLIKE"): Promise<void> {
  return api.post<void>(`/api/v1/posts/${postId}/react?type=${type}`);
}

export async function savePost(postId: string): Promise<void> {
  return api.post<void>(`/api/v1/posts/${postId}/save`);
}

export async function unsavePost(postId: string): Promise<void> {
  return api.delete<void>(`/api/v1/posts/${postId}/save`);
}

export async function getSavedPosts(): Promise<Post[]> {
  const results = await api.get<ApiPost[]>("/api/v1/posts/saved");
  return results.map(mapPost);
}

export async function getComments(postId: string): Promise<Comment[]> {
  const results = await api.get<ApiComment[]>(`/api/v1/posts/${postId}/comments`);
  return results.map(mapComment);
}

export async function addComment(postId: string, body: string): Promise<Comment> {
  const c = await api.post<ApiComment>(`/api/v1/posts/${postId}/comments`, { body });
  return mapComment(c);
}
