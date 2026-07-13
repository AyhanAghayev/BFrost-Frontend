"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getUnreadCount, getNotifications, markAllRead } from "@/lib/api/notifications";
import { logout } from "@/lib/api/auth";
import { getChatUnreadCount } from "@/lib/api/conversations";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Notification } from "@/lib/types";

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-label-md text-label-md transition-colors cursor-pointer",
        active
          ? "text-primary border-b-2 border-primary pb-1"
          : "text-on-surface-variant hover:text-action-blue"
      )}
    >
      {label}
    </Link>
  );
}

export default function TopNavBar() {
  const { currentUser, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {}); // silently ignore if not authenticated yet
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getChatUnreadCount()
        .then((n) => { if (!cancelled) setChatUnread(n); })
        .catch(() => {});
    load();
    const interval = setInterval(load, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleNotifications() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) {
      setNotifLoading(true);
      getNotifications()
        .then(setNotifs)
        .catch(() => setNotifs([]))
        .finally(() => setNotifLoading(false));
      if (unreadCount > 0) {
        markAllRead().catch(() => {});
        setUnreadCount(0);
      }
    }
  }

  async function handleSignOut() {
    try { await logout(); } catch { /* ignore */ }
    clearAuth();
    router.push("/sign-in");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="bg-surface border-b border-border-subtle w-full h-16 sticky top-0 z-50">
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-full">
        <div className="flex items-center gap-gutter">
          <Link
            href="/discover"
            className="font-headline-lg text-headline-lg font-black text-primary"
          >
            BFrost
          </Link>
          <nav className="hidden md:flex items-center gap-stack-md">
            <NavItem href="/discover" label="Discover" active={pathname === "/discover"} />
            <NavItem href="/wiki" label="Wiki" active={pathname.startsWith("/wiki")} />
            <NavItem href="/events" label="Events" active={pathname === "/events"} />
          </nav>
        </div>

        <div className="flex items-center gap-stack-md">
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center bg-surface-container rounded-full px-4 py-1.5 gap-stack-sm"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 outline-none"
              placeholder="Search BFrost"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div ref={notifRef} className="relative">
            <button
              onClick={toggleNotifications}
              className="p-2 -m-2 relative text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 max-h-[28rem] overflow-y-auto bg-white border border-border-subtle rounded-xl shadow-lg z-50">
                <div className="px-4 py-3 border-b border-border-subtle">
                  <h3 className="font-label-md text-on-surface">Notifications</h3>
                </div>
                {notifLoading ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
                    You&apos;re all caught up.
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {notifs.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex gap-3 px-4 py-3",
                          !n.isRead && "bg-action-blue/[0.04]"
                        )}
                      >
                        <img
                          src={n.actor.avatarUrl}
                          alt={n.actor.displayName}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-on-surface leading-snug">
                            <span className="font-semibold">{n.actor.displayName}</span>{" "}
                            {n.message}
                          </p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link href="/chat" className="relative p-2 -m-2">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              mail
            </span>
            {chatUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </Link>

          {currentUser && (
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen((o) => !o)}>
                <img
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover cursor-pointer"
                  src={currentUser.avatarUrl}
                />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white border border-border-subtle rounded-xl shadow-lg py-1 z-50">
                  <Link
                    href={`/profile/${currentUser.username}`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    View Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </Link>
                  <div className="h-px bg-border-subtle my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
