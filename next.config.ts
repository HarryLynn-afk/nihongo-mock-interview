import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // CLAUDE.md is our own hand-maintained session-continuity doc (see
  // workspace rule) — don't let Next.js auto-append its agent-rules block.
  agentRules: false,
};

export default nextConfig;
