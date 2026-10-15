/**
 * Vacancy Contact rule — pure, no I/O, no throw (callers decide how to surface
 * a violation).
 *
 * - A Vacancy Contact must currently work at the Vacancy's Company when it is
 *   set. Afterwards it is never re-checked: a Contact who moves on keeps being
 *   the Vacancy Contact of past searches (ADR 0004).
 * - Changing the Vacancy's Company without naming a Vacancy Contact clears it,
 *   so a Vacancy never points at someone from another firm by accident.
 */
export interface VacancyContactState {
  companyId: number | null;
  vacancyContactId: number | null;
}

export interface VacancyContactPatch {
  companyId?: number;
  vacancyContactId?: number | null;
}

export type VacancyContactResolution =
  /** `vacancyContactId: undefined` means "leave it as it is". */
  | { ok: true; vacancyContactId: number | null | undefined }
  | { ok: false; reason: 'contact_not_at_company' };

export const VacancyContactPolicy = {
  resolve(params: {
    /** The Vacancy before the change; null when creating it. */
    current: VacancyContactState | null;
    patch: VacancyContactPatch;
    /** Current Company of the Contact named in the patch, if any. */
    contactCompanyId?: number | null;
  }): VacancyContactResolution {
    const { current, patch, contactCompanyId } = params;
    const companyId = patch.companyId ?? current?.companyId ?? null;

    if (patch.vacancyContactId === null) {
      return { ok: true, vacancyContactId: null };
    }

    if (patch.vacancyContactId !== undefined) {
      if (companyId === null || contactCompanyId !== companyId) {
        return { ok: false, reason: 'contact_not_at_company' };
      }
      return { ok: true, vacancyContactId: patch.vacancyContactId };
    }

    const companyChanged =
      current !== null &&
      patch.companyId !== undefined &&
      patch.companyId !== current.companyId;
    return {
      ok: true,
      vacancyContactId: companyChanged ? null : undefined,
    };
  },
};
