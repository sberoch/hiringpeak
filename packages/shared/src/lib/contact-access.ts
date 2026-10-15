import { PermissionCode } from "../enums.js";
import type { Contact, ContactView } from "../types/contact.js";
import { hasCommercialAccess } from "./commercial-access.js";

/**
 * Permission codes that allow creating, editing and deleting Contacts (either
 * one): client-side counterparts are maintained under `COMPANY_MANAGE`, the
 * commercial network under `CRM_MANAGE`.
 */
export const CONTACT_MANAGE_CODES: readonly PermissionCode[] = [
  PermissionCode.COMPANY_MANAGE,
  PermissionCode.CRM_MANAGE,
];

/** True when the given permission codes allow managing Contacts. */
export function canManageContacts(codes: readonly string[]): boolean {
  return CONTACT_MANAGE_CODES.some((code) => codes.includes(code));
}

/**
 * The Contact as the viewer may see it. Users with neither commercial access
 * nor Contact management (recruiters) get name, role, email and phone only.
 */
export function contactForViewer(
  contact: Contact,
  codes: readonly string[],
): ContactView {
  if (hasCommercialAccess(codes) || canManageContacts(codes)) {
    return {
      id: contact.id,
      companyId: contact.companyId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      linkedin: contact.linkedin,
    };
  }
  return {
    id: contact.id,
    companyId: contact.companyId,
    name: contact.name,
    role: contact.role,
    email: contact.email,
    phone: contact.phone,
  };
}
