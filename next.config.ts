import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self)",
  },
  // Report-only until the live classroom is browser-tested: the app opens
  // Supabase and Deepgram connections, so an enforcing CSP could break it.
  {
    key: "Content-Security-Policy-Report-Only",
    value:
      "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  // CLAUDE.md is our own hand-maintained session-continuity doc (see
  // workspace rule) — don't let Next.js auto-append its agent-rules block.
  agentRules: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
