"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

type Tab = "profile" | "account" | "notifications" | "appearance";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "account", label: "Account", icon: "manage_accounts" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "appearance", label: "Appearance", icon: "palette" },
];

export default function SettingsPageClient() {
  const { currentUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");

  if (!currentUser) return null;

  return (
    <div className="flex-1 min-w-0 px-margin-mobile md:px-gutter py-gutter">
      <div className="mb-stack-lg">
        <h1 className="font-headline-md text-headline-md text-primary">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      <div className="flex lg:hidden gap-1 overflow-x-auto pb-1 mb-stack-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors flex-shrink-0",
                active
                  ? "bg-primary text-white"
                  : "bg-white border border-border-subtle text-on-surface-variant hover:border-primary/30"
              )}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        <nav className="hidden lg:flex lg:col-span-3 flex-col gap-1 lg:sticky lg:top-20">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-stack-md px-4 py-3 rounded-lg font-label-md text-label-md transition-colors text-left w-full",
                  active
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                )}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={
                    active ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="lg:col-span-9">
        </div>
      </div>
    </div>
  );
}
