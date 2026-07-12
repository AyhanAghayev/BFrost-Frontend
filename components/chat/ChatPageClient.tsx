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
    <div className="flex-1 min-w-0 flex h-[calc(100vh-64px)] overflow-hidden">
      <section
        className={cn(
          "flex-shrink-0 w-full md:w-80 border-r border-border-subtle bg-white flex flex-col",
          mobileRoom !== null && "hidden md:flex"
        )}
      >
        <div className="p-gutter space-y-stack-md border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">Messages</h2>
            <button
              onClick={openPicker}
              title="New message"
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">edit_square</span>
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {roomsLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="px-gutter py-12 text-center text-sm text-on-surface-variant">
              No conversations yet. You can message people you and they both follow.
            </div>
          ) : (
            rooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room.id)}
                  className={cn(
                    "w-full p-4 flex gap-3 text-left transition-colors",
                    isActive
                      ? "bg-surface-container-low border-l-4 border-primary"
                      : "hover:bg-surface-container-low border-l-4 border-transparent"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    {room.avatarUrl ? (
                      <img
                        src={room.avatarUrl}
                        alt={room.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                        {roomInitials(room.name)}
                      </div>
                    )}
                    {room.isDirect && (
                      <span
                        title={room.participantIds.some((id) => onlineIds.has(id)) ? "Online" : "Offline"}
                        className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full",
                          room.participantIds.some((id) => onlineIds.has(id))
                            ? "bg-green-500"
                            : "bg-on-surface-variant/40"
                        )}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2 mb-0.5">
                      <span className={cn(
                        "truncate font-label-md",
                        room.unreadCount > 0 ? "text-on-surface font-bold" : "text-on-surface"
                      )}>
                        {room.name}
                      </span>
                      {room.unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {room.unreadCount > 9 ? "9+" : room.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      room.unreadCount > 0 ? "text-on-surface font-medium" : "text-on-surface-variant"
                    )}>
                      {room.lastMessage || "Start the conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Active chat window */}
      <section
        className={cn(
          "flex-1 flex flex-col bg-surface-faint min-w-0",
          mobileRoom === null && "hidden md:flex"
        )}
      >
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
            {roomsLoading ? "Loading…" : "Select a conversation to start chatting."}
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header className="h-16 px-gutter border-b border-border-subtle bg-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-1 -ml-1 mr-1 text-on-surface-variant"
                  onClick={() => setMobileRoom(null)}
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>

                <Link
                  href={activeRoom.username ? `/profile/${activeRoom.username}` : "#"}
                  className="relative shrink-0"
                  aria-disabled={!activeRoom.username}
                >
                  {activeRoom.avatarUrl ? (
                    <img
                      src={activeRoom.avatarUrl}
                      alt={activeRoom.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm">
                      {roomInitials(activeRoom.name)}
                    </div>
                  )}
                </Link>
                <div>
                  <Link
                    href={activeRoom.username ? `/profile/${activeRoom.username}` : "#"}
                    className="font-label-md text-on-surface hover:underline"
                  >
                    {activeRoom.name}
                  </Link>
                  <p className="text-[11px] text-on-surface-variant leading-none">
                    Direct message
                  </p>
                </div>
              </div>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-gutter space-y-stack-lg">
              {messages.length === 0 && (
                <p className="text-center text-on-surface-variant text-sm py-8">
                  No messages yet. Say hello!
                </p>
              )}

              {messages.map((msg) => {
                const isSent = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex gap-3", isSent ? "flex-row-reverse" : "flex-row")}
                    style={{ maxWidth: "80%", ...(isSent ? { marginLeft: "auto" } : {}) }}
                  >
                    {!isSent && (
                      <img
                        src={msg.sender.avatarUrl}
                        alt={msg.sender.displayName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 self-end mb-1"
                      />
                    )}
                    <div className={cn("flex flex-col gap-1", isSent && "items-end")}>
                      <div
                        className={cn(
                          "px-4 py-3 shadow-sm",
                          isSent
                            ? "bg-primary text-white rounded-2xl rounded-br-sm"
                            : "bg-white text-on-surface rounded-2xl rounded-bl-sm border border-border-subtle"
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                      </div>
                      <div className={cn("flex items-center gap-1", isSent ? "mr-1" : "ml-1")}>
                        <span className="text-[10px] text-on-surface-variant">
                          {formatMessageTime(msg.sentAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input footer */}
            <footer className="p-gutter bg-white border-t border-border-subtle flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message…"
                    rows={1}
                    className="w-full py-3 px-4 bg-surface-container-low border-none rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary max-h-32 overflow-y-auto"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!text.trim() || sending}
                  className="mb-1 w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[22px]">send</span>
                </button>
              </div>
              <p className="mt-2 text-[10px] text-on-surface-variant text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </footer>
          </>
        )}
      </section>

      {/* New-message friend picker */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl border border-border-subtle w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
              <h3 className="font-headline-md text-headline-md text-primary">New message</h3>
              <button
                onClick={() => setPickerOpen(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
              >
                close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friendsLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : friends.length === 0 ? (
                <div className="px-gutter py-12 text-center text-sm text-on-surface-variant">
                  No friends yet. You can message people you and they both follow.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {friends.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => startChat(f.id)}
                      disabled={startingId === f.id}
                      className="w-full flex items-center gap-3 px-gutter py-3 text-left hover:bg-surface-container-low transition-colors disabled:opacity-50"
                    >
                      <img
                        src={f.avatarUrl}
                        alt={f.displayName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-label-md text-on-surface truncate">{f.displayName}</p>
                        <p className="text-sm text-on-surface-variant truncate">@{f.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}