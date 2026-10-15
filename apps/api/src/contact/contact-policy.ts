import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';

/**
 * Rules for writing Contacts. Pure: no I/O, no throw — each returns a
 * violation message (Spanish, user-facing) or null; callers decide how to
 * surface it.
 *
 * The wider network — Contacts without a Company, Contact Source ("Origen"),
 * Contact Owner ("Responsable") and the short description — belongs to the
 * commercial side. Recruiters (Contact managers without commercial access)
 * maintain only a Company's current Contacts and their basic fields.
 */

type ContactWrite = {
  companyId?: number | null;
  /** A new Company, created by name, becomes the Contact's Company. */
  newCompanyName?: string | null;
  sourceId?: number | null;
  ownerId?: number | null;
  shortDescription?: string | null;
  /** "Abordar en X días": a follow-up Task, which is commercial. */
  followUpInDays?: number | null;
};

/**
 * Violation when a caller without commercial access touches the network.
 * `existing` is the Contact being edited; omit it when creating.
 */
export function networkFieldViolation(
  write: ContactWrite,
  codes: readonly string[],
  existing?: { companyId: number | null },
): string | null {
  if (hasCommercialAccess(codes)) return null;

  if (existing && existing.companyId == null) {
    return 'Contacto no encontrado.';
  }
  const companyCleared =
    !write.newCompanyName &&
    (existing ? write.companyId === null : write.companyId == null);
  if (companyCleared) {
    return 'Sin acceso comercial, el contacto tiene que pertenecer a una empresa.';
  }
  if (
    write.sourceId !== undefined ||
    write.ownerId !== undefined ||
    write.shortDescription !== undefined
  ) {
    return 'Sin acceso comercial no se puede cargar el origen, el responsable ni la descripción del contacto.';
  }
  if (write.followUpInDays != null) {
    return 'Sin acceso comercial no se pueden agendar seguimientos.';
  }
  return null;
}

/**
 * The Contact Owner on creation: the requested one (`null` = "Sin
 * responsable"), else the creator when they have commercial access.
 */
export function defaultContactOwner(
  requested: number | null | undefined,
  creator: { id: number; codes: readonly string[] },
): number | null {
  if (requested !== undefined) return requested;
  return hasCommercialAccess(creator.codes) ? creator.id : null;
}

/** Only users with commercial access can own a Contact. */
export function contactOwnerViolation(
  ownerId: number | null | undefined,
  commercialUserIds: readonly number[],
): string | null {
  if (ownerId == null) return null;
  return commercialUserIds.includes(ownerId)
    ? null
    : 'El responsable tiene que tener acceso comercial.';
}
