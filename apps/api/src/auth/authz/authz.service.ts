import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionCode } from '@workspace/shared/enums';
import { PermissionService } from '../../permission/permission.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class AuthzService {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Returns permission codes for the user (from their org role).
   * Returns empty array if user has no roleId. INTERNAL_USER is not given codes here;
   * the guard treats them as having all permissions.
   */
  async getPermissionCodesForUser(userId: number): Promise<string[]> {
    const result = await this.getMePermissions(userId);
    return result.permissionCodes;
  }

  /**
   * Returns role and permission codes for the current user (for GET /auth/me/permissions).
   */
  async getMePermissions(userId: number): Promise<{
    roleId: number | null;
    roleName: string | null;
    permissionCodes: string[];
  }> {
    const user = await this.userService.findById(userId);
    if (!user?.roleId || user.organizationId == null) {
      return { roleId: null, roleName: null, permissionCodes: [] };
    }

    try {
      const role = await this.roleService.findOne(user.roleId, user.organizationId);
      const permissionCodes = await this.permissionService.getCodesByIds(
        role.permissionIds,
      );
      return {
        roleId: user.roleId,
        roleName: role.name,
        permissionCodes,
      };
    } catch (err) {
      if (err instanceof NotFoundException) {
        return { roleId: null, roleName: null, permissionCodes: [] };
      }
      throw err;
    }
  }

  /** Check if user has at least one of the required permission codes. */
  async userHasAnyPermission(
    userId: number,
    codes: PermissionCode[],
  ): Promise<boolean> {
    if (codes.length === 0) return true;
    const userCodes = await this.getPermissionCodesForUser(userId);
    return codes.some((c) => userCodes.includes(c));
  }
}
