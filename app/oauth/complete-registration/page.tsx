"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeRegistration, getMe } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/stores/auth.store";

const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ayhan",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=julian",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
];

const inputCls =
  "w-full bg-surface-faint border border-border-subtle rounded-xl px-4 " +
  "py-3 text-body-md text-on-surface focus:outline-none " +
  "focus:ring-2 focus:ring-action-blue/40 focus:border-action-blue " +
  "transition-all placeholder:text-on-surface-variant/50";

function PasswordStrength({ password }: { password: string }) {
  const score = [
    /.{8,}/,
    /[A-Z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/,
  ].filter((r) => r.test(password)).length;

  if (!password) return null;

  const bars = [
    score >= 1
      ? score <= 1
        ? "bg-error"
        : score === 2
          ? "bg-amber-400"
          : "bg-emerald-500"
      : "bg-border-subtle",

    score >= 2
      ? score === 2
        ? "bg-amber-400"
        : "bg-emerald-500"
      : "bg-border-subtle",

    score >= 3
      ? score === 3
        ? "bg-emerald-400"
        : "bg-emerald-500"
      : "bg-border-subtle",

    score >= 4
      ? "bg-emerald-500"
      : "bg-border-subtle",
  ];

  const label = ["", "Weak", "Fair", "Good", "Strong"][score];

  const labelCls = [
    "",
    "text-error",
    "text-amber-500",
    "text-emerald-600",
    "text-emerald-600",
  ][score];


  return (
    <div className="flex items-center gap-2 mt-2">
      {bars.map((cls, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full transition-colors ${cls}`}
        />
      ))}

      <span className={`text-label-sm ml-1 ${labelCls}`}>
        {label}
      </span>
    </div>
  );
}

function CompleteRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!token) {
      setError("Missing or invalid registration link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await completeRegistration({ token, password });

      const user = await getMe();
      setAuth(user);

      router.push("/discover");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }


  if (!token) {
    return (
      <p className="flex items-center gap-2 text-body-sm text-error">
        <span className="material-symbols-outlined text-[16px]">
          error
        </span>
        Missing or invalid registration link.
      </p>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="font-label-md text-label-md text-on-surface"
        >
          Password
        </label>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            lock
          </span>

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
            className={`${inputCls} pl-11 pr-12`}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>


      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="font-label-md text-label-md text-on-surface"
        >
          Confirm password
        </label>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            lock
          </span>

          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
            className={`${inputCls} pl-11 pr-12`}
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showConfirmPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>


      {error && (
        <p className="flex items-center gap-1.5 text-body-sm text-error">
          <span className="material-symbols-outlined text-[16px]">
            error
          </span>
          {error}
        </p>
      )}


      <button
        type="submit"
        disabled={loading}
        className="
          w-full py-3.5 rounded-xl bg-primary text-white
          font-label-md text-label-md hover:opacity-90
          active:scale-[0.99] transition-all
          disabled:opacity-60 flex items-center justify-center gap-2
        "
      >
        {loading ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>

            Setting up your account…
          </>
        ) : (
          "Finish setting up your account"
        )}
      </button>

    </form>
  );
}



export default function CompleteRegistrationPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">

      <section
        className="
          relative hidden md:flex md:w-5/12 lg:w-1/2
          flex-col justify-between p-12 overflow-hidden
        "
        style={{ backgroundColor: "#001B3D" }}
      >

        <div
          className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none"
          style={{
            background: "rgba(46,91,255,0.18)",
            transform: "translate(40%, -40%)"
          }}
        />

        <div className="relative z-10">
          <span className="font-headline-md text-headline-md font-black text-white">
            BFrost
          </span>
        </div>


        <div className="relative z-10 flex flex-col gap-6">

          <h1
            className="text-white leading-tight"
            style={{
              fontFamily: "var(--font-manrope)",
              fontSize: "clamp(32px, 3.5vw, 48px)",
              fontWeight: 800,
            }}
          >
            Welcome to{" "}
            <span style={{color:"rgba(173,198,255,0.9)"}}>
              BFrost.
            </span>
          </h1>


          <p
            className="text-body-md leading-relaxed max-w-sm"
            style={{
              color:"rgba(255,255,255,0.65)"
            }}
          >
            Create your password and start discovering clubs,
            events, and students at your university.
          </p>


          <div
            className="flex items-center gap-4 rounded-xl p-4"
            style={{
              background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.1)",
              backdropFilter:"blur(12px)"
            }}
          >

            <div className="flex -space-x-3">
              {AVATARS.map((src,i)=>(
                <img
                  key={i}
                  src={src}
                  className="w-10 h-10 rounded-full"
                  style={{
                    border:"2px solid #001B3D"
                  }}
                  alt="Member"
                />
              ))}
            </div>


            <p
              className="font-label-md text-label-md"
              style={{
                color:"rgba(255,255,255,0.8)"
              }}
            >
              Joined by{" "}
              <span className="font-bold text-white">
                2,000+ students
              </span>
            </p>

          </div>

        </div>


        <div
  className="relative z-10 flex gap-5"
  style={{
    color: "rgba(255,255,255,0.3)"
  }}
>
  <a
    href="#"
    className="text-label-sm hover:text-white/60 transition-colors"
  >
    Privacy
  </a>

  <a
    href="#"
    className="text-label-sm hover:text-white/60 transition-colors"
  >
    Terms
  </a>

  <a
    href="#"
    className="text-label-sm hover:text-white/60 transition-colors"
  >
    Help
  </a>
</div>


      </section>


      <section className="
        flex-1 flex flex-col justify-center
        items-center px-6 py-12 md:px-16 bg-white
      ">

        <div className="md:hidden mb-10 w-full max-w-md">
          <span className="font-headline-md text-headline-md font-black text-primary">
            BFrost
          </span>
        </div>


        <div className="w-full max-w-md flex flex-col gap-8">

          <div>
            <h2 className="font-headline-md text-headline-md text-primary mb-1">
              Almost there
            </h2>

            <p className="text-body-sm text-on-surface-variant">
              Set a password to finish creating your BFrost account.
            </p>
          </div>


          <Suspense fallback={null}>
            <CompleteRegistrationForm />
          </Suspense>


        </div>

      </section>


    </main>
  );
}