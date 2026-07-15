import type { NextConfig } from "next";

// The browser only ever talks to the frontend origin; requests to /api/* are
// proxied server-side to the backend. This keeps the auth cookie first-party so
// mobile browsers (Safari ITP, Chrome 3p-cookie phase-out) don't discard it.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
      // OAuth2 login + callback also live on the backend and must be same-origin.
      { source: "/oauth2/:path*", destination: `${BACKEND_ORIGIN}/oauth2/:path*` },
      { source: "/login/oauth2/:path*", destination: `${BACKEND_ORIGIN}/login/oauth2/:path*` },
    ];
  },
};

export default nextConfig;
