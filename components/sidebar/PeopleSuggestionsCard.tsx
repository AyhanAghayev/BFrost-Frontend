"use client";

import { useState } from "react";
import type { User } from "@/lib/types";

export default function PeopleSuggestionsCard({ users }: { users: User[] }) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <section className="bg-white rounded-xl border border-border-subtle p-stack-md shadow-sm">
      <h3 className="font-label-md uppercase tracking-wider text-primary mb-4">
        People you may know
      </h3>
      <div className="flex flex-col gap-4">
        {users.map((user) => {
          const isFollowed = followed.has(user.id);
          return (
            <div key={user.id} className="flex items-center gap-3">
              <img
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                src={user.avatarUrl}
              />
              <div className="flex-1 min-w-0">
                <span className="font-label-md text-primary block truncate">
                  {user.displayName}
                </span>
                <span className="text-label-sm text-on-surface-variant block truncate">
                  {user.department}
                </span>
              </div>
              <button
                onClick={() => toggle(user.id)}
                className={
                  isFollowed
                    ? "bg-primary text-white px-3 py-1 rounded-lg font-label-md text-xs hover:opacity-90 transition-colors"
                    : "border border-action-blue text-action-blue px-3 py-1 rounded-lg font-label-md text-xs hover:bg-action-blue/5 transition-colors"
                }
              >
                {isFollowed ? "Following" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>
      <button className="w-full mt-4 text-action-blue font-label-md text-sm hover:underline text-center">
        View all suggestions
      </button>
    </section>
  );
}