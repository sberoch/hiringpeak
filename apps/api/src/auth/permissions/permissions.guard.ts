import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '@workspace/shared/enums';
import { PERMISSIONS_KEY } from './permissions.decorator';
import type { PermissionCode } from '@workspace/shared/enums';
import { AuthzService } from '../authz/authz.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authzService: AuthzService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCodes = this.reflector.getAllAndOverride<PermissionCode[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredCodes?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as
      | { id: number; userType?: string; role?: string }
      | undefined;

    if (!user?.id) {
      throw new ForbiddenException('Unauthorized');
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    // INTERNAL_USER (system admin) bypasses permission check
    if (user.userType === UserType.INTERNAL_USER) {
      return true;
    }

    const hasAny = await this.authzService.userHasAnyPermission(
      userId,
      requiredCodes,
    );
    if (!hasAny) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
