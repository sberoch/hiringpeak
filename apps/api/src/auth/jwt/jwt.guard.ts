import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../auth.decorators';
import { ClsService } from 'nestjs-cls';
import { CurrentUserStore } from '../auth.currentuser.store';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService<CurrentUserStore>,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // if (process.env.PRODUCTION === 'false') return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      const req = context.switchToHttp().getRequest();
      const headers = req.headers;
      if (headers.authorization) {
        const token = headers.authorization.split(' ')[1];
        const decoded = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        );
        this.cls.set('user', decoded);
      }
      return true;
    }
    return super.canActivate(context);
  }
}
