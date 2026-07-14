"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MOCK_CLUBS } from "@/lib/mock/clubs";
import { MOCK_EVENTS } from "@/lib/mock/events";

const NetworkGlobe = dynamic(() => import("./NetworkGlobe"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  Technology:   { icon: "memory",              color: "#2E5BFF", bg: "rgba(46,91,255,0.1)"  },
  Arts:         { icon: "palette",             color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  Business:     { icon: "business_center",     color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  Academic:     { icon: "school",              color: "#6366F1", bg: "rgba(99,102,241,0.1)" },
  Volunteering: { icon: "volunteer_activism",  color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  Gaming:       { icon: "sports_esports",      color: "#EF4444", bg: "rgba(239,68,68,0.1)"  },
};

const FORMAT_META: Record<string, { label: string; color: string; bg: string }> = {
  "in-person": { label: "In person", color: "#059669", bg: "rgba(5,150,105,0.1)"  },
  online:      { label: "Online",    color: "#2E5BFF", bg: "rgba(46,91,255,0.1)"  },
  hybrid:      { label: "Hybrid",    color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
};

const AVATARS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=leyla",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=ayhan",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=julian",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
];

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LandingPage() {
  const now = new Date().toISOString();
  const upcomingEvents = MOCK_EVENTS
    .filter((e) => e.startsAt >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);

  const sortedClubs = [...MOCK_CLUBS].sort((a, b) => b.memberCount - a.memberCount);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "var(--font-inter)" }}>
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16 border-b"
        style={{ backgroundColor: "#001B3D", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link
          href="/"
          className="font-black text-white tracking-tight"
          style={{ fontFamily: "var(--font-manrope)", fontSize: 22 }}
        >
          BFrost
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/clubs" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}>
            Clubs
          </Link>
          <Link href="/events" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.6)" }}>
            Events
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-semibold transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: "#2E5BFF", color: "#fff" }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ backgroundColor: "#001B3D", minHeight: "calc(100vh - 64px)" }}
      >
        {/* Background glow orbs */}
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(46,91,255,0.14) 0%, transparent 70%)",
            transform: "translate(-30%, -40%)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(46,91,255,0.08) 0%, transparent 70%)",
            transform: "translateY(40%)",
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-0">
          {/* Left: content */}
          <div className="flex-1 flex flex-col gap-8 lg:pr-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold self-start"
              style={{ background: "rgba(46,91,255,0.15)", color: "#93b4ff", border: "1px solid rgba(46,91,255,0.25)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#2E5BFF" }}
              />
              Now open to all students
            </div>

            <h1
              className="text-white leading-[1.1]"
              style={{
                fontFamily: "var(--font-manrope)",
                fontSize: "clamp(38px, 5.5vw, 64px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
              }}
            >
              Every club at your
              <br />
              university,{" "}
              <span style={{ color: "#6b96ff" }}>in one place.</span>
            </h1>

            <p
              className="max-w-md leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)", fontSize: 18 }}
            >
              BFrost connects you with the clubs, events, and people that make
              university life worth it. Find your people — starting today.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#2E5BFF" }}
              >
                Get started free
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/clubs"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 active:scale-[0.98]"
                style={{ color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Browse clubs
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Student"
                    className="w-9 h-9 rounded-full object-cover"
                    style={{ border: "2px solid #001B3D" }}
                  />
                ))}
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Joined by{" "}
                <span className="font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                  2,000+ students
                </span>{" "}
                across {MOCK_CLUBS.length} clubs
              </p>
            </div>
          </div>

          {/* Right: 3D globe */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="relative w-full" style={{ maxWidth: 520, aspectRatio: "1 / 1" }}>
              <NetworkGlobe />
              <p
                className="absolute bottom-4 left-0 right-0 text-center text-xs"
                style={{ color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}
              >
                Drag to rotate · hover clubs to explore
              </p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span
              className="text-xs font-bold uppercase tracking-[0.15em] mb-3 block"
              style={{ color: "#2E5BFF" }}
            >
              How it works
            </span>
            <h2
              className="text-primary"
              style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              From discovery to belonging
              <br />
              in three steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "travel_explore",
                title: "Find your clubs",
                body: "Browse every student organization at your university. Filter by interest, size, or category.",
                color: "#2E5BFF",
                bg: "rgba(46,91,255,0.07)",
              },
              {
                icon: "event_available",
                title: "Attend events",
                body: "RSVP to workshops, meetups, and competitions. Never miss something you care about.",
                color: "#10B981",
                bg: "rgba(16,185,129,0.07)",
              },
              {
                icon: "auto_stories",
                title: "Build your story",
                body: "Your memberships, posts, and attended events — all in one profile that travels with you.",
                color: "#8B5CF6",
                bg: "rgba(139,92,246,0.07)",
              },
            ].map(({ icon, title, body, color, bg }) => (
              <div
                key={title}
                className="flex flex-col gap-4 p-7 rounded-2xl border border-border-subtle"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg }}
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ color }}>
                    {icon}
                  </span>
                </div>
                <div>
                  <h3
                    className="font-bold text-primary mb-1.5"
                    style={{ fontFamily: "var(--font-manrope)", fontSize: 18 }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-faint py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-[0.15em] mb-3 block"
                style={{ color: "#2E5BFF" }}
              >
                {MOCK_CLUBS.length} clubs and counting
              </span>
              <h2
                className="text-primary"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Something for every student.
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant" style={{ maxWidth: 480 }}>
                From robotics to volunteering, BFrost hosts every student organization — and more join each semester.
              </p>
            </div>
            <Link
              href="/clubs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 hover:opacity-80 transition-opacity"
              style={{ color: "#2E5BFF" }}
            >
              Browse all clubs
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedClubs.map((club) => {
              const meta = CATEGORY_META[club.category] ?? { icon: "group", color: "#44474e", bg: "rgba(68,71,78,0.1)" };
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="flex flex-col gap-4 p-6 rounded-xl bg-white border border-border-subtle hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: meta.bg }}
                    >
                      <span className="material-symbols-outlined text-[22px]" style={{ color: meta.color }}>
                        {meta.icon}
                      </span>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {club.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-sm mb-1" style={{ fontFamily: "var(--font-manrope)" }}>
                      {club.name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        {club.memberCount.toLocaleString()} members
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {club.eventCount ?? 0} events
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-4">
            <div>
              <span
                className="text-xs font-bold uppercase tracking-[0.15em] mb-3 block"
                style={{ color: "#2E5BFF" }}
              >
                What&apos;s on
              </span>
              <h2
                className="text-primary"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                Happening this week.
              </h2>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 hover:opacity-80 transition-opacity"
              style={{ color: "#2E5BFF" }}
            >
              View all events
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {upcomingEvents.map((event) => {
              const fmt = FORMAT_META[event.format] ?? FORMAT_META["in-person"];
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-5 p-5 rounded-xl border border-border-subtle bg-white hover:shadow-sm transition-all"
                >
                  <div className="hidden sm:block shrink-0 rounded-xl overflow-hidden" style={{ width: 96, height: 64 }}>
                    <img
                      src={event.coverImageUrl ?? "https://picsum.photos/seed/event/96/64"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: fmt.bg, color: fmt.color }}
                      >
                        {fmt.label}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {event.clubName}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-primary truncate" style={{ fontFamily: "var(--font-manrope)" }}>
                      {event.title}
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      {formatEventDate(event.startsAt)}
                      {event.location && (
                        <>
                          <span className="mx-1 opacity-40">·</span>
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          <span className="truncate max-w-[160px]">{event.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right hidden md:block">
                    <p className="text-xs font-semibold text-primary">
                      {event.attendeeCount}
                    </p>
                    <p className="text-xs text-on-surface-variant">RSVPs</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="relative overflow-hidden py-28 px-6 lg:px-12"
        style={{ backgroundColor: "#001B3D" }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 120%, rgba(46,91,255,0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
          <h2
            className="text-white leading-tight"
            style={{ fontFamily: "var(--font-manrope)", fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.025em" }}
          >
            Ready to find
            <br />
            <span style={{ color: "#6b96ff" }}>your people?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 17, maxWidth: 420 }}>
            Join BFrost for free and become part of the clubs, events, and
            conversations that define campus life.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: "#2E5BFF" }}
            >
              Sign up — it&apos;s free
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-white/10 active:scale-[0.98]"
              style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer
        className="px-6 lg:px-12 py-8"
        style={{ backgroundColor: "#001830", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="font-black text-white tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", fontSize: 18 }}
          >
            BFrost
          </span>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Help"].map((label) => (
              <a
                key={label}
                href="#"
                className="text-xs hover:text-white/60 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {label}
              </a>
            ))}
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 BFrost
          </span>
        </div>
      </footer>
    </div>
  );
}