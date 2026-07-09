"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth.store";

const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=kamran",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
];

const inputCls =
  "w-full bg-surface-faint border border-border-subtle rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-action-blue/40 focus:border-action-blue transition-all placeholder:text-on-surface-variant/50";

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) =>
    r.test(password)
  ).length;

  if (!password) return null;

  const bars = [
    score >= 1 ? (score <= 1 ? "bg-error" : score === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-border-subtle",
    score >= 2 ? (score === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-border-subtle",
    score >= 3 ? (score === 3 ? "bg-emerald-400" : "bg-emerald-500") : "bg-border-subtle",
    score >= 4 ? "bg-emerald-500" : "bg-border-subtle",
  ];

  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  const labelCls = ["", "text-error", "text-amber-500", "text-emerald-600", "text-emerald-600"][score];

  return (
    <div className="flex items-center gap-2 mt-2">
      {bars.map((cls, i) => (
        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${cls}`} />
      ))}
      <span className={`text-label-sm text-label-sm ml-1 ${labelCls}`}>{label}</span>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form & { general: string }>>({});

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = "Enter your full name.";
    if (!form.email.trim()) e.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.username.trim()) e.username = "Choose a username.";
    else if (!/^[a-z0-9_]{3,20}$/.test(form.username))
      e.username = "3–20 chars, lowercase letters, numbers, underscores only.";
    if (!form.password) e.password = "Choose a password.";
    else if (form.password.length < 8) e.password = "At least 8 characters.";
    if (!form.terms) e.terms = "You must accept the terms." as unknown as boolean;
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        displayName: form.fullName,
      });
      const user = await getMe(result.accessToken);
      setAuth(user, result.accessToken);
      router.push("/discover");
    } catch (err: unknown) {
      setErrors((e) => ({
        ...e,
        general: err instanceof Error ? err.message : "Registration failed. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section
        className="relative hidden md:flex md:w-5/12 flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#001B3D" }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(46,91,255,0.15)", transform: "translate(30%, 30%)" }}
        />

        <div className="relative z-10">
          <span className="font-headline-md text-headline-md font-black text-white tracking-tight">
            BFrost
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <h1
            className="text-white leading-tight"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Your university life,{" "}
            <span style={{ color: "rgba(173,198,255,0.9)" }}>all in one place.</span>
          </h1>
          <p className="text-body-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            Join clubs, attend events, and connect with fellow students across every faculty and interest.
          </p>

          <ul className="flex flex-col gap-3 mt-2">
            {[
              ["group", "6 clubs to explore and join"],
              ["event", "Events updated every week"],
              ["forum", "Club feeds and wiki articles"],
            ].map(([icon, text]) => (
              <li key={icon} className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(46,91,255,0.25)" }}
                >
                  <span className="material-symbols-outlined text-[18px] text-white">{icon}</span>
                </span>
                <span className="text-body-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <div
            className="flex items-center gap-3 rounded-xl p-4 mt-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex -space-x-2.5 shrink-0">
              {AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Member"
                  className="w-9 h-9 rounded-full object-cover"
                  style={{ border: "2px solid #001B3D" }}
                />
              ))}
            </div>
            <p className="text-body-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              <span className="font-bold text-white">2,000+ students</span> already here
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-5" style={{ color: "rgba(255,255,255,0.3)" }}>
          <a href="#" className="text-label-sm hover:text-white/60 transition-colors">Privacy</a>
          <a href="#" className="text-label-sm hover:text-white/60 transition-colors">Terms</a>
          <a href="#" className="text-label-sm hover:text-white/60 transition-colors">Help</a>
        </div>
      </section>

      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-16 bg-white overflow-y-auto">
        <div className="md:hidden mb-8 w-full max-w-md">
          <span className="font-headline-md text-headline-md font-black text-primary tracking-tight">
            BFrost
          </span>
        </div>

        <div className="w-full max-w-md flex flex-col gap-7">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-1">
              Create your account
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Free forever. No credit card needed.
            </p>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-border-subtle rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-faint active:scale-[0.99] transition-all"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="font-label-md text-label-md text-on-surface">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Ayhan Agayev"
                className={`${inputCls} ${errors.fullName ? "border-error focus:ring-error/30" : ""}`}
                autoComplete="name"
              />
              {errors.fullName && (
                <p className="text-body-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface">
                University email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@university.edu"
                className={`${inputCls} ${errors.email ? "border-error focus:ring-error/30" : ""}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-body-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="font-label-md text-label-md text-on-surface">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-medium select-none">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value.toLowerCase())}
                  placeholder="ayhan"
                  className={`${inputCls} pl-8 ${errors.username ? "border-error focus:ring-error/30" : ""}`}
                  autoComplete="username"
                />
              </div>
              {errors.username && (
                <p className="text-body-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.username}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-label-md text-label-md text-on-surface">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-12 ${errors.password ? "border-error focus:ring-error/30" : ""}`}
                  autoComplete="new-password"
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
              <PasswordStrength password={form.password} />
              {errors.password && (
                <p className="text-body-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={form.terms}
                onChange={(e) => set("terms", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-subtle text-primary focus:ring-action-blue accent-primary"
              />
              <label htmlFor="terms" className="text-body-sm text-on-surface-variant leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-action-blue hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-action-blue hover:underline">Privacy Policy</a>.
              </label>
            </div>
            {errors.terms && (
              <p className="text-body-sm text-error flex items-center gap-1 -mt-2">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {String(errors.terms)}
              </p>
            )}

            {errors.general && (
              <p className="text-body-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {String(errors.general)}
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
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-action-blue font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}