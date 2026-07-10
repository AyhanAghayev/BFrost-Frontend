"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { createPost } from "@/lib/api/posts";
import { listClubs } from "@/lib/api/clubs";
import { uploadImage } from "@/lib/api/upload";
import type { Post, Club } from "@/lib/types";

interface Props {
  clubId?: string;
  onPost?: (post: Post) => void;
}

// "My Feed" = post to own user page; otherwise a club the user belongs to.
type Target = { kind: "user" } | { kind: "club"; id: string; name: string };

export default function PostCreatorCard({ clubId, onPost }: Props) {
  const { currentUser } = useAuthStore();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Target picker — only shown when the card isn't locked to a specific club.
  const [target, setTarget] = useState<Target>({ kind: "user" });
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const locked = clubId != null;

  useEffect(() => {
    if (locked) return;
    listClubs()
      .then((clubs) => setMyClubs(clubs.filter((c) => c.isMember)))
      .catch(() => setMyClubs([]));
  }, [locked]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pickerOpen]);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      setMediaUrl(await uploadImage("posts", file));
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url && /^https?:\/\//.test(url.trim())) setLinkUrl(url.trim());
  }

  async function handlePost() {
    if ((!body.trim() && !mediaUrl) || !currentUser) return;
    const toClubId = clubId ?? (target.kind === "club" ? target.id : null);
    setSubmitting(true);
    try {
      const post = await createPost({
        targetType: toClubId ? "CLUB_PAGE" : "USER_PAGE",
        targetId: toClubId ?? currentUser.id,
        postType: mediaUrl ? "IMAGE" : linkUrl ? "LINK" : "TEXT",
        body: body.trim(),
        mediaUrl: mediaUrl ?? undefined,
        linkUrl: linkUrl ?? undefined,
      });
      setBody("");
      setMediaUrl(null);
      setLinkUrl(null);
      onPost?.(post);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-stack-md shadow-sm">
      <div className="flex gap-stack-md">
        {currentUser && (
          <img
            alt={currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            src={currentUser.avatarUrl}
          />
        )}
        <div className="flex-1 flex flex-col gap-stack-sm">
          <div className="flex items-center gap-stack-sm mb-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Posting to:</span>
            {locked ? (
              <span className="flex items-center gap-1 font-label-md text-label-md text-primary bg-surface-container-low px-3 py-1 rounded-full border border-border-subtle">
                This club
              </span>
            ) : (
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className="flex items-center gap-1 font-label-md text-label-md text-primary bg-surface-container-low px-3 py-1 rounded-full border border-border-subtle hover:bg-surface-container-high transition-colors"
                >
                  {target.kind === "club" ? target.name : "My Feed"}
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {pickerOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-border-subtle bg-white p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setTarget({ kind: "user" });
                        setPickerOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-label-md text-label-md leading-6 hover:bg-surface-container-high transition-colors"
                    >
                      My Feed
                      {target.kind === "user" && (
                        <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                      )}
                    </button>
                    {myClubs.length > 0 && (
                      <div className="my-1.5 border-t border-border-subtle" />
                    )}
                    {myClubs.map((club) => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => {
                          setTarget({ kind: "club", id: club.id, name: club.name });
                          setPickerOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-label-md text-label-md leading-6 hover:bg-surface-container-high transition-colors"
                      >
                        <span className="truncate">{club.name}</span>
                        {target.kind === "club" && target.id === club.id && (
                          <span className="material-symbols-outlined shrink-0 text-[18px] text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <textarea
            className="w-full bg-surface-container-low border-none focus:ring-0 text-body-md min-h-[80px] p-4 rounded-lg placeholder:text-on-surface-variant/60 resize-none outline-none"
            placeholder="What's on your mind? Share an update..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {mediaUrl && (
            <div className="relative w-fit">
              <img src={mediaUrl} alt="attachment" className="max-h-48 rounded-lg border border-border-subtle" />
              <button
                onClick={() => setMediaUrl(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-on-surface text-white rounded-full flex items-center justify-center text-[14px]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}
          {linkUrl && (
            <div className="flex items-center gap-2 bg-surface-container-low border border-border-subtle rounded-lg px-3 py-2 w-fit max-w-full">
              <span className="material-symbols-outlined text-[18px] text-action-blue">link</span>
              <span className="text-sm text-action-blue truncate">{linkUrl}</span>
              <button onClick={() => setLinkUrl(null)} className="material-symbols-outlined text-[16px] text-on-surface-variant">
                close
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
            <div className="flex gap-stack-md text-on-surface-variant">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Add image"
                className="material-symbols-outlined hover:text-primary transition-colors disabled:opacity-50"
              >
                {uploading ? "hourglass_empty" : "image"}
              </button>
              <button
                onClick={handleLink}
                title="Add link"
                className="material-symbols-outlined hover:text-primary transition-colors"
              >
                link
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={submitting || (!body.trim() && !mediaUrl)}
              className="bg-primary text-white px-6 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}