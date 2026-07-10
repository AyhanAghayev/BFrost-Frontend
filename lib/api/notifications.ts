import { api } from "./client";
import type { Notification } from "@/lib/types";

export interface ApiNotification {
  id: string;
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  actorPictureUrl: string | null;
  type: "FOLLOW" | "LIKE" | "COMMENT" | "JOIN_REQUEST";
  targetId: string | null;
  targetType: string | null;
  message: string | null;
  read: boolean;
  createdAt: string;
}

function mapType(t: ApiNotification["type"]): Notification["type"] {
  switch (t) {
    case "FOLLOW": return "follow";
    case "LIKE": return "like";
    case "COMMENT": return "comment";
    case "JOIN_REQUEST": return "join_request";
    default: return "follow";
  }
}

function mapNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    type: mapType(n.type),
    actorId: n.actorId,
    actor: {
      id: n.actorId,
      displayName: n.actorDisplayName,
      avatarUrl: n.actorPictureUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${n.actorUsername}`,
    },
    targetId: n.targetId ?? "",
    targetType: (n.targetType?.toLowerCase() as Notification["targetType"]) ?? "user",
    message: n.message ?? "",
    isRead: n.read,
    createdAt: n.createdAt,
  };
}

export async function getNotifications(): Promise<Notification[]> {
  const results = await api.get<ApiNotification[]>("/api/v1/notifications");
  return results.map(mapNotification);
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ count: number }>("/api/v1/notifications/unread-count");
  return res.count;
}

export async function markAllRead(): Promise<void> {
  return api.post<void>("/api/v1/notifications/mark-all-read");
}
