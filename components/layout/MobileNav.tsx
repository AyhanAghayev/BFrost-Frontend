"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

interface MobileNavItem {
  id: string;
  href: string;
  icon: string;
  label: string;
  activeOn: string[];
}

const ITEMS: MobileNavItem[] = [
  { id: "home",    href: "/discover",       icon: "home",          label: "Home",    activeOn: ["/discover"] },
  { id: "groups",  href: "/clubs",          icon: "group",         label: "Clubs",   activeOn: ["/clubs"] },
  { id: "post",    href: "/discover",       icon: "add_circle",    label: "Post",    activeOn: [] },
  { id: "events",  href: "/events",         icon: "event",         label: "Events",  activeOn: ["/events"] },
  { id: "profile", href: "/profile",        icon: "person",        label: "Profile", activeOn: ["/profile"] },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();

  const profileHref = currentUser ? `/profile/${currentUser.username}` : "/sign-in";

  function isActive(item: MobileNavItem): boolean {
    return item.activeOn.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-border-subtle z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center h-16">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const href = item.id === "profile" ? profileHref : item.href;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 h-full",
                active ? "text-primary" : "text-on-surface-variant"
              )}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}