import { api } from "./client";
import type { ChatRoom, Message } from "@/lib/types";

export async function getOnlineUserIds(): Promise<string[]> {
  return api.get<string[]>("/api/v1/presence");
}

export async function getChatUnreadCount(): Promise<number> {
  return api.get<number>("/api/v1/conversations/unread-count");
}

export async function markConversationRead(conversationId: string): Promise<void> {
  return api.post<void>(`/api/v1/conversations/${conversationId}/read`);
}


interface ApiConversation {
  id: string;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  otherPictureUrl: string | null;
  unreadCount: number;
  createdAt: string;
}

interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderPictureUrl: string | null;
  body: string;
  createdAt: string;
}

interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const avatar = (url: string | null, seed: string) =>
  url ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;


function mapConversation(c: ApiConversation): ChatRoom {
  return {
    id: c.id,
    name: c.otherDisplayName,
    username: c.otherUsername,
    avatarUrl: c.otherPictureUrl,
    lastMessage: "",
    lastMessageAt: c.createdAt,
    unreadCount: c.unreadCount,
    isDirect: true,
    participantIds: [c.otherUserId],
  };
}

function mapMessage(m: ApiMessage): Message {
  return {
    id: m.id,
    roomId: m.conversationId,
    senderId: m.senderId,
    sender: {
      id: m.senderId,
      displayName: m.senderDisplayName,
      avatarUrl: avatar(m.senderPictureUrl, m.senderUsername),
    },
    body: m.body,
    sentAt: m.createdAt,
  };
}


export async function listConversations(): Promise<ChatRoom[]> {
  const results = await api.get<ApiConversation[]>("/api/v1/conversations");
  return results.map(mapConversation);
}

export async function getOrCreateConversation(otherUserId: string): Promise<ChatRoom> {
  const c = await api.post<ApiConversation>(`/api/v1/conversations/with/${otherUserId}`);
  return mapConversation(c);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const page = await api.get<CursorPage<ApiMessage>>(
    `/api/v1/conversations/${conversationId}/messages?size=50`
  );
  return page.items
    .map(mapMessage)
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export async function sendMessage(conversationId: string, body: string): Promise<Message> {
  const m = await api.post<ApiMessage>(
    `/api/v1/conversations/${conversationId}/messages`,
    { body }
  );
  return mapMessage(m);
}

export async function clearConversation(conversationId: string): Promise<void> {
  return api.post<void>(`/api/v1/conversations/${conversationId}/clear`);
}
