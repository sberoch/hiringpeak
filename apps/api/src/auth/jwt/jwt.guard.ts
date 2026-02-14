import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../auth.decorators';
import { ClsService } from 'nestjs-cls';
import { CurrentUserStore } from '../auth.currentuser.store';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly cls: ClsService<CurrentUserStore>,
    private readonly userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

        const userId =
          typeof decoded.id === 'string'
            ? parseInt(decoded.id, 10)
            : decoded.id;

        try {
          const user = await this.userService.findById(userId);
          if (!user) return false;
          const organizationId = user.organizationId ?? undefined;
          const userData = {
            ...decoded,
            organizationId,
          };

          this.cls.set('user', userData);
          this.cls.set('organizationId', organizationId);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
