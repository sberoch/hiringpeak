import { PermissionCode } from "../enums.js";

/** Permission codes that grant access to the commercial side (either one). */
export const COMMERCIAL_ACCESS_CODES: readonly PermissionCode[] = [
  PermissionCode.CRM_READ,
  PermissionCode.CRM_MANAGE,
];

/**
 * True when the given permission codes grant commercial access
 * (`CRM_READ` or `CRM_MANAGE`). Shared by the API and the Web app.
 */
export function hasCommercialAccess(codes: readonly string[]): boolean {
  return COMMERCIAL_ACCESS_CODES.some((code) => codes.includes(code));
}
