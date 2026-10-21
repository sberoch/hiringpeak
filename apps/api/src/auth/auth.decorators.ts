import { createParamDecorator, SetMetadata } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';
import { CurrentUserStore } from './auth.currentuser.store';

// Public decorator to mark routes as public
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(() => {
  const cls = ClsServiceManager.getClsService<CurrentUserStore>();
  return cls.get('user');
});

/**
 * The authenticated User's id as a number (the session stores it as a
 * string). Use instead of parsing `@CurrentUser().id` by hand.
 */
export const CurrentUserId = createParamDecorator((): number => {
  const cls = ClsServiceManager.getClsService<CurrentUserStore>();
  return Number(cls.get('user').id);
});
