import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { CurrentUserStore } from '../auth.currentuser.store';

export const OrganizationId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext) => {
    const cls = ClsServiceManager.getClsService<CurrentUserStore>();
    return cls.get('organizationId');
  },
);
