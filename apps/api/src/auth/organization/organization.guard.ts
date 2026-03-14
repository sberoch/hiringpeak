import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CurrentUserStore } from '../auth.currentuser.store';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly cls: ClsService<CurrentUserStore>) {}

  canActivate(_context: ExecutionContext): boolean {
    const organizationId = this.cls.get('organizationId');
    if (organizationId == null) {
      throw new ForbiddenException('Organization context required');
    }
    return true;
  }
}
