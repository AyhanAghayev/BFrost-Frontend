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
        <div className="w-full max-w-md">
          <h2 className="font-headline-md text-headline-md text-primary mb-1">
            Create your account
          </h2>
        </div>
      </section>
    </main>
  );
}