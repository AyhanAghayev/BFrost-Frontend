"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { updateProfile, changePassword, changeEmail, deleteAccount } from "@/lib/api/users";
import { uploadImage } from "@/lib/api/upload";
import {
  PROFILE_BACKGROUNDS,
  DEFAULT_BACKGROUND_ID,
  resolveBackgroundStyle,
} from "@/lib/profileBackgrounds";

type Tab = "profile" | "account" | "notifications" | "appearance";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "account", label: "Account", icon: "manage_accounts" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
  { id: "appearance", label: "Appearance", icon: "palette" },
];

export default function SettingsPageClient() {
  const { currentUser, setCurrentUser, clearAuth } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Email change
  const [emailEditing, setEmailEditing] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Delete account
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  async function handleChangePassword() {
    if (!pw.current || pw.next.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: "", next: "" });
      setPwMsg({ ok: true, text: "Password updated." });
    } catch (err: unknown) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to update password" });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!currentUser) return;
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      await changeEmail(emailForm.newEmail.trim(), emailForm.password);
      setCurrentUser({ ...currentUser, email: emailForm.newEmail.trim() });
      setEmailEditing(false);
      setEmailForm({ newEmail: "", password: "" });
      setEmailMsg({ ok: true, text: "Email updated." });
    } catch (err: unknown) {
      setEmailMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to update email" });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteErr("");
    try {
      await deleteAccount(deletePw);
      clearAuth();
      router.replace("/sign-in");
    } catch (err: unknown) {
      setDeleteErr(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !currentUser) return;
    setUploadingAvatar(true);
    setSaveMsg(null);
    try {
      const url = await uploadImage("avatars", file);
      const updated = await updateProfile(currentUser.id, { profilePictureUrl: url });
      setCurrentUser(updated);
      setSaveMsg({ ok: true, text: "Photo updated." });
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setUploadingAvatar(false);
    }
  }

  const [form, setForm] = useState({
    displayName: currentUser?.displayName ?? "",
    username: currentUser?.username ?? "",
    bio: currentUser?.bio ?? "",
    department: currentUser?.department ?? "",
    university: currentUser?.university ?? "",
    background: currentUser?.backgroundUrl ?? DEFAULT_BACKGROUND_ID,
  });

  async function handleSaveProfile() {
    if (!currentUser) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await updateProfile(currentUser.id, {
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        university: form.university.trim(),
        department: form.department.trim(),
        backgroundUrl: form.background,
      });
      setCurrentUser(updated);
      setSaveMsg({ ok: true, text: "Profile saved." });
    } catch (err: unknown) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

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
          {tab === "profile" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">
                  Public profile
                </h2>
                <div className="flex items-center gap-3">
                  {saveMsg && (
                    <span className={cn("text-sm", saveMsg.ok ? "text-emerald-600" : "text-error")}>
                      {saveMsg.text}
                    </span>
                  )}
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>

              <div className="p-gutter space-y-stack-lg">
                {/* Avatar row */}
                <div className="flex items-center gap-gutter p-5 bg-surface-faint rounded-xl border border-border-subtle">
                  <div className="relative flex-shrink-0">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.displayName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                    />
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-action-blue text-white rounded-full flex items-center justify-center border-2 border-white shadow hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      <span
                        className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        photo_camera
                      </span>
                    </button>
                  </div>
                  <div>
                    <p className="font-label-md text-on-surface">Profile photo</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      {uploadingAvatar ? "Uploading…" : "PNG or JPG, at least 400×400px"}
                    </p>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="mt-2 text-sm text-action-blue hover:underline font-label-md"
                    >
                      Change photo
                    </button>
                  </div>
                </div>

                {/* Profile background */}
                <div className="space-y-stack-md">
                  <div>
                    <p className="font-label-md text-on-surface">Profile background</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      Pick a banner color for your profile.
                    </p>
                  </div>
                  {/* Live preview */}
                  <div
                    className="h-24 w-full rounded-xl border border-border-subtle"
                    style={resolveBackgroundStyle(form.background)}
                  />
                  {/* Swatches */}
                  <div className="flex flex-wrap gap-3">
                    {PROFILE_BACKGROUNDS.map((bg) => {
                      const selected = form.background === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, background: bg.id }))}
                          title={bg.label}
                          aria-label={bg.label}
                          aria-pressed={selected}
                          className={cn(
                            "w-12 h-12 rounded-lg border-2 transition-all relative",
                            selected
                              ? "border-action-blue ring-2 ring-action-blue/30 scale-105"
                              : "border-border-subtle hover:border-action-blue/40"
                          )}
                          style={bg.style}
                        >
                          {selected && (
                            <span
                              className="material-symbols-outlined absolute inset-0 m-auto w-fit h-fit text-white text-[18px] drop-shadow"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <Field label="Display name">
                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, displayName: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Username">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm select-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, username: e.target.value }))
                        }
                        className={cn(inputCls, "pl-8")}
                      />
                    </div>
                  </Field>

                  <div className="md:col-span-2">
                    <Field label="Bio">
                      <textarea
                        rows={3}
                        value={form.bio}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, bio: e.target.value }))
                        }
                        className={cn(inputCls, "resize-none")}
                      />
                    </Field>
                  </div>

                  <Field label="Department">
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, department: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>

                  <Field label="University">
                    <input
                      type="text"
                      value={form.university}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, university: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === "account" && (
            <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
              <div className="px-gutter py-stack-md border-b border-border-subtle">
                <h2 className="font-headline-md text-headline-md text-primary">
                  Account
                </h2>
              </div>

              <div className="divide-y divide-border-subtle">
                {/* Email */}
                <div className="px-gutter py-stack-lg">
                  <p className="font-label-md text-on-surface mb-stack-md">
                    Email address
                  </p>
                  {!emailEditing ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="email"
                        value={currentUser.email ?? "—"}
                        readOnly
                        className="flex-1 px-4 py-3 bg-surface-faint border border-border-subtle rounded-xl text-sm text-on-surface-variant cursor-not-allowed"
                      />
                      <button
                        onClick={() => {
                          setEmailEditing(true);
                          setEmailMsg(null);
                          setEmailForm({ newEmail: currentUser.email ?? "", password: "" });
                        }}
                        className="flex-shrink-0 px-5 py-3 border border-action-blue text-action-blue rounded-xl font-label-md text-label-md hover:bg-action-blue/5 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md max-w-xl">
                      <input
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
                        placeholder="New email address"
                        autoComplete="email"
                        className={inputCls}
                      />
                      <input
                        type="password"
                        value={emailForm.password}
                        onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Current password"
                        autoComplete="current-password"
                        className={inputCls}
                      />
                      <div className="sm:col-span-2 flex items-center gap-3">
                        <button
                          onClick={handleChangeEmail}
                          disabled={emailSaving || !emailForm.newEmail.trim() || !emailForm.password}
                          className="px-5 py-2.5 bg-primary text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {emailSaving ? "Saving…" : "Save email"}
                        </button>
                        <button
                          onClick={() => { setEmailEditing(false); setEmailForm({ newEmail: "", password: "" }); }}
                          className="px-5 py-2.5 border border-border-subtle rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-faint transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {emailMsg && (
                    <p className={cn("text-sm mt-stack-md", emailMsg.ok ? "text-emerald-600" : "text-error")}>
                      {emailMsg.text}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="px-gutter py-stack-lg">
                  <p className="font-label-md text-on-surface mb-stack-md">Password</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md max-w-xl">
                    <input
                      type="password"
                      value={pw.current}
                      onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                      placeholder="Current password"
                      autoComplete="current-password"
                      className={inputCls}
                    />
                    <input
                      type="password"
                      value={pw.next}
                      onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                      placeholder="New password (min 8 chars)"
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-stack-md">
                    <button
                      onClick={handleChangePassword}
                      disabled={pwSaving}
                      className="px-5 py-2.5 bg-primary text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {pwSaving ? "Updating…" : "Update password"}
                    </button>
                    {pwMsg && (
                      <span className={cn("text-sm", pwMsg.ok ? "text-emerald-600" : "text-error")}>
                        {pwMsg.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="px-gutter py-stack-lg">
                  <p className="font-label-md text-error mb-1">Danger zone</p>
                  <p className="text-sm text-on-surface-variant mb-stack-md">
                    Permanently delete your account and all associated data —
                    posts, clubs you own, and events. This cannot be undone.
                  </p>
                  {!deleteOpen ? (
                    <button
                      onClick={() => { setDeleteOpen(true); setDeleteErr(""); setDeletePw(""); }}
                      className="px-5 py-2.5 bg-red-50 border border-red-200 text-error rounded-xl font-label-md text-label-md hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete_forever
                      </span>
                      Delete account
                    </button>
                  ) : (
                    <div className="max-w-md rounded-xl border border-red-200 bg-red-50/50 p-4">
                      <p className="text-sm text-on-surface mb-stack-md">
                        Enter your password to confirm. This is permanent.
                      </p>
                      <input
                        type="password"
                        value={deletePw}
                        onChange={(e) => setDeletePw(e.target.value)}
                        placeholder="Current password"
                        autoComplete="current-password"
                        className={cn(inputCls, "mb-stack-md")}
                      />
                      {deleteErr && <p className="text-sm text-error mb-stack-md">{deleteErr}</p>}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleting || !deletePw}
                          className="px-5 py-2.5 bg-error text-white rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {deleting ? "Deleting…" : "Permanently delete"}
                        </button>
                        <button
                          onClick={() => { setDeleteOpen(false); setDeletePw(""); setDeleteErr(""); }}
                          disabled={deleting}
                          className="px-5 py-2.5 border border-border-subtle rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-white transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 bg-surface-faint border border-border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-action-blue transition-all";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}
