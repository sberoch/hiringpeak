import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserType } from '@workspace/shared/enums';

/**
 * Restricts access to INTERNAL_USER (backoffice / system admin) only.
 * Use for permission.controller, organization.controller, onboard.controller.
 */
@Injectable()
export class InternalUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { userType?: string } | undefined;
    if (user?.userType === UserType.INTERNAL_USER) {
      return true;
    }
    throw new ForbiddenException('Access restricted to system administrators');
  }
}
