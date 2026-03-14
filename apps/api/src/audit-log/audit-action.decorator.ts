import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit:action';

export interface AuditActionOptions {
  /** Business action name (e.g. create_user, update_role). */
  eventType: string;
  /** Entity kind (e.g. user, role). */
  entityType: string;
}

/**
 * Mark a controller method as audited. Used by AuditInterceptor to persist an
 * event after a successful mutation. Entity ID is inferred from route params
 * (:id) or from the handler result (result.id) for creates.
 */
export const AuditAction = (options: AuditActionOptions) =>
  SetMetadata(AUDIT_ACTION_KEY, options);
