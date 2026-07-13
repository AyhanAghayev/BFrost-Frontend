"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

interface NavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  activeOn: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", href: "/discover", icon: "home", label: "Home Feed", activeOn: ["/discover"] },
  { id: "communities", href: "/clubs", icon: "group", label: "Communities", activeOn: ["/clubs"] },
  { id: "wiki", href: "/wiki", icon: "book_2", label: "Wiki Hub", activeOn: ["/wiki"] },
  { id: "events", href: "/events", icon: "event", label: "Event Calendar", activeOn: ["/events"] },
];

export default function SideNavBar() {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.currentUser?.role === "ADMIN");

  function isActive(item: NavItem): boolean {
    return item.activeOn.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  return (
    <aside className="h-[calc(100vh-64px)] w-64 sticky top-16 hidden lg:flex flex-col gap-gutter p-gutter bg-surface-faint border-r border-border-subtle overflow-y-auto">
      <div className="flex flex-col gap-stack-sm mb-4">
        <span className="font-headline-md text-headline-md font-bold text-primary">Navigation</span>
        <span className="font-label-md text-label-md text-on-surface-variant">Community Explorer</span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-stack-sm rounded-lg px-4 py-3 transition-all active:scale-[0.98]",
                active
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-border-subtle pt-4">
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-stack-sm rounded-lg px-4 py-2 transition-all",
              pathname.startsWith("/admin")
                ? "bg-primary text-white"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            <span className="material-symbols-outlined">shield_person</span>
            <span className="font-label-md text-label-md">Admin</span>
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-stack-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-4 py-2 transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-label-md">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
