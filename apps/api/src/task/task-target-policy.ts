/**
 * A Task is attached to at most one of: Candidate, Vacancy, Candidacy, Company.
 * Standalone (all four nullable FKs null) is valid. Pure: no I/O, no throw —
 * callers decide how to surface the violation. See CONTEXT.md (`Task`).
 */
export type TaskAttachmentTargets = {
  candidateId?: number | null;
  vacancyId?: number | null;
  candidateVacancyId?: number | null;
  companyId?: number | null;
};

export class TaskTargetPolicy {
  static countTargets(t: TaskAttachmentTargets): number {
    let n = 0;
    if (t.candidateId != null) n++;
    if (t.vacancyId != null) n++;
    if (t.candidateVacancyId != null) n++;
    if (t.companyId != null) n++;
    return n;
  }

  static isValid(t: TaskAttachmentTargets): boolean {
    return TaskTargetPolicy.countTargets(t) <= 1;
  }
}
