/**
 * Where an Organization's Branding files live in Firebase Storage. The path
 * includes the Organization so one tenant's files never mix with another's.
 */
export function brandingStorageDir(organizationId: number): string {
  return `organizations/${organizationId}/branding`;
}

/**
 * Whether `url` is a Firebase Storage download URL for a file under the
 * Organization's Branding directory. Download URLs carry the object path
 * URL-encoded after `/o/`.
 */
export function isBrandingStorageUrl(
  url: string,
  organizationId: number,
): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return false;
  }
  const marker = "/o/";
  const at = pathname.indexOf(marker);
  if (at === -1) return false;
  let objectPath: string;
  try {
    objectPath = decodeURIComponent(pathname.slice(at + marker.length));
  } catch {
    return false;
  }
  return objectPath.startsWith(`${brandingStorageDir(organizationId)}/`);
}
