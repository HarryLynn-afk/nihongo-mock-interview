/**
 * Shared helper for the per-purpose env sub-modules. Throws at import
 * time of the sub-module that calls it — never lazily inside a request
 * handler — so a missing key surfaces at boot, not at first request.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
