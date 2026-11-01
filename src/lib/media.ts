/**
 * Media urls are either absolute (external hosts) or backend-relative like
 * `/media/listings/{id}/{file}`. Relative urls only resolve against the API
 * origin; the server passes that origin to client islands as `mediaOrigin`
 * because the origin env var is not available in browser bundles.
 */
export function resolveMediaUrl(mediaOrigin: string | null | undefined, url: string): string {
  if (!url.startsWith("/")) return url;
  return mediaOrigin ? `${mediaOrigin}${url}` : url;
}
