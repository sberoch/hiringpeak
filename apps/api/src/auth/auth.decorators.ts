import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { CurrentUserStore } from './auth.currentuser.store';

// Public decorator to mark routes as public
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext) => {
    const cls = ClsServiceManager.getClsService<CurrentUserStore>();
    return cls.get('user');
  },
);
