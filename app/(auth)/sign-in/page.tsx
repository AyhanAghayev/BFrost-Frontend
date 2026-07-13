"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, getMe } from "@/lib/api/auth";
import { BASE } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";

const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ayhan",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=julian",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
];

const inputCls =
  "w-full bg-surface-faint border border-border-subtle rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-action-blue/40 focus:border-action-blue transition-all placeholder:text-on-surface-variant/50";

export default function SignInPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your email or username."); return; }
    if (!password) { setError("Enter your password."); return; }
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      const user = await getMe();
      setAuth(user);
      router.push("/discover");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section className="relative hidden md:flex md:w-5/12 lg:w-1/2 flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#001B3D" }}
      >
        <div
          className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(46,91,255,0.18)", transform: "translate(40%, -40%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(46,91,255,0.12)", transform: "translate(-40%, 40%)" }}
        />

        <div className="relative z-10">
          <span className="font-headline-md text-headline-md font-black text-white tracking-tight">
            BFrost
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <h1
            className="text-white leading-tight"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Find your people{" "}
            <span style={{ color: "rgba(173,198,255,0.9)" }}>at university.</span>
          </h1>
          <p className="text-body-md leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Discover clubs, join events, and build lasting friendships — one platform for every student at your university.
          </p>

          <div
            className="flex items-center gap-4 rounded-xl p-4 mt-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex -space-x-3 shrink-0">
              {AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Member"
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: "2px solid #001B3D" }}
                />
              ))}
            </div>
            <p className="font-label-md text-label-md" style={{ color: "rgba(255,255,255,0.8)" }}>
              Joined by{" "}
              <span className="font-bold text-white">2,000+ students</span>{" "}
              across 6 active clubs.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-5" style={{ color: "rgba(255,255,255,0.3)" }}>
          <a href="#" className="text-label-sm text-label-sm hover:text-white/60 transition-colors">Privacy</a>
          <a href="#" className="text-label-sm text-label-sm hover:text-white/60 transition-colors">Terms</a>
          <a href="#" className="text-label-sm text-label-sm hover:text-white/60 transition-colors">Help</a>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 bg-white">
        <div className="md:hidden mb-10 w-full max-w-md">
          <span className="font-headline-md text-headline-md font-black text-primary tracking-tight">
            BFrost
          </span>
        </div>

        <div className="w-full max-w-md flex flex-col gap-8">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-1">
              Welcome back
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Sign in to continue to your clubs and events.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${BASE}/oauth2/authorization/google`; }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border-subtle rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-faint active:scale-[0.99] transition-all"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  person
                </span>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@university.edu"
                  className={`${inputCls} pl-11`}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-label-md text-label-md text-on-surface">
                  Password
                </label>
                <a href="#" className="text-body-sm text-action-blue hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className={`${inputCls} pl-11 pr-12`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-body-sm text-error">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-label-md text-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-action-blue font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}