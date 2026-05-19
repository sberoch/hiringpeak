import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit:action';

/**
 * Path expression used to extract a label from the response body.
 * Supports dotted paths, e.g. `candidate.name` or `vacancy.title`.
 */
export type LabelPath = string;

export interface AuditRelatedFieldOption {
  /** Entity kind for the related label (e.g. `candidate`, `vacancy`). */
  type: string;
  /** Path on the response body to read the related label from. */
  field: LabelPath;
}

export interface AuditActionOptions {
  /** Business action name (e.g. create_user, update_role). */
  eventType: string;
  /** Entity kind (e.g. user, role). */
  entityType: string;
  /**
   * Path on the response body to read the primary entity label from
   * (e.g. `title` for vacancy, `name` for candidate, `email` for user).
   */
  labelField?: LabelPath;
  /** Additional labels to record alongside the primary (assignments, comments, files). */
  relatedFields?: AuditRelatedFieldOption[];
}

/**
 * Mark a controller method as audited. Used by AuditInterceptor to persist an
 * event after a successful mutation. Entity ID is inferred from route params
 * (:id) or from the handler result (result.id) for creates.
 */
export const AuditAction = (options: AuditActionOptions) =>
  SetMetadata(AUDIT_ACTION_KEY, options);
