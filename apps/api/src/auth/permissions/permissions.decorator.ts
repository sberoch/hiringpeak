import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@workspace/shared/enums';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Require at least one of the given permission codes for the route.
 * Used with PermissionsGuard. INTERNAL_USER (system admin) bypasses check.
 */
export const Permissions = (...codes: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);
