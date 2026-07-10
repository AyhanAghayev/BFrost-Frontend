"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import FeedFilter, { type FeedFilterType } from "./FeedFilter";
import PostCard from "./PostCard";

export default function FeedSection({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState<FeedFilterType>("relevant");

  const sorted = [...posts].sort((a, b) => {
    if (filter === "trending") return b.likeCount - a.likeCount;
    if (filter === "latest")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="flex flex-col gap-gutter">
      <FeedFilter active={filter} onChange={setFilter} />
      {sorted.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}