/** Netlify may expose the immutable deploy URL as request.url behind its proxy. */
export function requestOrigin(request: Request): string {
  const siteUrl = process.env.NODE_ENV === "production" ? process.env.URL : null;
  // Use deployment configuration, never caller-supplied forwarding headers.
  return new URL(siteUrl || request.url).origin;
}
