/**
 * Where an Organization's Branding files live in Firebase Storage. The path
 * includes the Organization so one tenant's files never mix with another's.
 */
export function brandingStorageDir(organizationId: number): string {
  return `organizations/${organizationId}/branding`;
}

/** The host Firebase Storage serves download URLs from. */
export const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

const DOWNLOAD_PATH = /^\/v0\/b\/([^/]+)\/o\/([^/]+)$/;

/**
 * Whether `url` is an https Firebase Storage download URL for a file under the
 * Organization's Branding directory (and in `bucket`, when given). Download
 * URLs carry the object path URL-encoded after `/o/`. Paths that climb out of
 * the directory (`..`, `.`, empty segments, backslashes) or that stay encoded
 * after decoding (double encoding) are rejected.
 */
export function isBrandingStorageUrl(
  url: string,
  organizationId: number,
  bucket?: string,
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== FIREBASE_STORAGE_HOST || parsed.port !== "") {
    return false;
  }
  const match = DOWNLOAD_PATH.exec(parsed.pathname);
  if (!match) return false;
  const [, urlBucket, encodedPath] = match;
  if (bucket !== undefined && decodeSafely(urlBucket) !== bucket) return false;
  const objectPath = decodeSafely(encodedPath);
  if (objectPath === null || /[%\\]/.test(objectPath)) return false;
  const dir = `${brandingStorageDir(organizationId)}/`;
  if (!objectPath.startsWith(dir)) return false;
  return objectPath
    .slice(dir.length)
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function decodeSafely(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
