"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Client } from "@stomp/stompjs";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/utils/format";
import type { ChatRoom, Message, User } from "@/lib/types";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  listConversations,
  getMessages,
  sendMessage as apiSendMessage,
  getOrCreateConversation,
  getOnlineUserIds,
  markConversationRead,
} from "@/lib/api/conversations";
import { getFriends } from "@/lib/api/users";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const WS_URL = BASE.replace(/^http/, "ws") + "/ws-native";

const avatarFor = (url: string | null, seed: string) =>
  url ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

export default function ChatPageClient() {
  const { currentUser } = useAuthStore();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileRoom, setMobileRoom] = useState<string | null>(null);

  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  const [pickerOpen, setPickerOpen] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stompRef = useRef<Client | null>(null);
  const [stompConnected, setStompConnected] = useState(false);
  const activeRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  useEffect(() => {
    listConversations()
      .then((data) => {
        setRooms(data);
        if (data.length > 0) setActiveRoomId(data[0].id);
      })
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getOnlineUserIds()
        .then((ids) => { if (!cancelled) setOnlineIds(new Set(ids)); })
        .catch(() => {});
    load();
    const interval = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!useAuthStore.getState().isAuthenticated) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      onConnect: () => {
        setStompConnected(true);
        client.subscribe("/user/queue/messages", (frame) => {
          try {
            const m = JSON.parse(frame.body);
            const msg: Message = {
              id: m.id,
              roomId: m.conversationId,
              senderId: m.senderId,
              sender: {
                id: m.senderId,
                displayName: m.senderDisplayName,
                avatarUrl: avatarFor(m.senderPictureUrl, m.senderUsername),
              },
              body: m.body,
              sentAt: m.createdAt,
            };
            const myId = useAuthStore.getState().currentUser?.id;
            const isActive = msg.roomId === activeRoomIdRef.current;
            const fromOther = msg.senderId !== myId;
            if (isActive) {
              setMessages((prev) =>
                prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]
              );
            }
            setRooms((prev) => {
              if (prev.some((r) => r.id === msg.roomId)) {
                return prev.map((r) =>
                  r.id === msg.roomId
                    ? {
                        ...r,
                        lastMessage: msg.body,
                        lastMessageAt: msg.sentAt,
                        unreadCount:
                          !isActive && fromOther ? r.unreadCount + 1 : r.unreadCount,
                      }
                    : r
                );
              }
              listConversations().then(setRooms).catch(() => {});
              return prev;
            });
            if (isActive && fromOther) markConversationRead(msg.roomId).catch(() => {});
          } catch {
          }
        });
      },
      onDisconnect: () => setStompConnected(false),
      onWebSocketClose: () => setStompConnected(false),
    });

    client.activate();
    stompRef.current = client;
    return () => {
      stompRef.current = null;
      client.deactivate();
    };
  }, []);

  const refreshMessages = useCallback((roomId: string) => {
    getMessages(roomId)
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }
    setMessages([]);
    refreshMessages(activeRoomId);
    const interval = setInterval(() => {
      if (!stompRef.current?.connected) refreshMessages(activeRoomId);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeRoomId, refreshMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeRoomId) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === activeRoomId && r.unreadCount > 0 ? { ...r, unreadCount: 0 } : r))
    );
    markConversationRead(activeRoomId).catch(() => {});
  }, [activeRoomId]);

  function selectRoom(id: string) {
    setActiveRoomId(id);
    setMobileRoom(id);
    setText("");
  }

  function openPicker() {
    setPickerOpen(true);
    setFriendsLoading(true);
    getFriends()
      .then(setFriends)
      .catch(() => setFriends([]))
      .finally(() => setFriendsLoading(false));
  }

  async function startChat(userId: string) {
    setStartingId(userId);
    try {
      const room = await getOrCreateConversation(userId);
      setRooms((prev) => (prev.some((r) => r.id === room.id) ? prev : [room, ...prev]));
      setActiveRoomId(room.id);
      setMobileRoom(room.id);
      setPickerOpen(false);
    } catch {
    } finally {
      setStartingId(null);
    }
  }

  async function sendMessage() {
    const body = text.trim();
    if (!body || !currentUser || !activeRoomId || sending) return;
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (stompRef.current?.connected) {
      stompRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ conversationId: activeRoomId, body }),
      });
      return;
    }

    setSending(true);
    try {
      const msg = await apiSendMessage(activeRoomId, body);
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  }

  function roomInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("");
  }

return (
  <div className="flex h-[calc(100vh-64px)] items-center justify-center">
    <p>Loading chat interface…</p>
  </div>
);
}