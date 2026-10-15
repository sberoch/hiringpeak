import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionCode } from '@workspace/shared/enums';
import { COMMERCIAL_ACCESS_CODES } from '@workspace/shared/lib/commercial-access';
import {
  organizations,
  permissions,
  rolePermissions,
  users,
} from '@workspace/shared/schemas';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { DrizzleProvider } from '../../common/database/drizzle.module';
import type { DrizzleDatabase } from '../../common/database/types/drizzle';
import { PermissionService } from '../../permission/permission.service';
import { RoleService } from '../../role/role.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class AuthzService {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
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
    organizationName: string | null;
    permissionCodes: string[];
  }> {
    const user = await this.userService.findById(userId);
    if (!user?.organizationId) {
      return {
        roleId: null,
        roleName: null,
        organizationName: null,
        permissionCodes: [],
      };
    }

    let organizationName: string | null = null;
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
      columns: { name: true },
    });
    organizationName = org?.name ?? null;

    if (!user.roleId) {
      return {
        roleId: null,
        roleName: null,
        organizationName,
        permissionCodes: [],
      };
    }

    try {
      const role = await this.roleService.findOne(
        user.roleId,
        user.organizationId,
      );
      const permissionCodes = await this.permissionService.getCodesByIds(
        role.permissionIds,
      );
      return {
        roleId: user.roleId,
        roleName: role.name,
        organizationName,
        permissionCodes,
      };
    } catch (err) {
      if (err instanceof NotFoundException) {
        return {
          roleId: null,
          roleName: null,
          organizationName,
          permissionCodes: [],
        };
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

  /**
   * Active Users of the Organization whose Role grants commercial access
   * (`CRM_READ` or `CRM_MANAGE`): the only Users who can own commercial records.
   */
  async listCommercialUsers(
    organizationId: number,
  ): Promise<{ id: number; name: string; email: string }[]> {
    return this.db
      .selectDistinct({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, users.roleId))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.active, true),
          inArray(permissions.code, [...COMMERCIAL_ACCESS_CODES]),
        ),
      )
      .orderBy(asc(users.name), asc(users.id));
  }

  async isCommercialUser(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    const commercialUsers = await this.listCommercialUsers(organizationId);
    return commercialUsers.some((u) => u.id === userId);
  }
}
