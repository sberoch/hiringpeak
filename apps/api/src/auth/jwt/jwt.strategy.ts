import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CurrentUserStore } from '../auth.currentuser.store';
import { UserService } from '../../user/user.service';
import 'dotenv/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly cls: ClsService<CurrentUserStore>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const userId =
      typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id;
    const user = await this.userService.findById(userId);
    if (!user) return null;

    const organizationId = user.organizationId ?? undefined;
    const userData = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      active: payload.active,
      userType: user.userType,
      roleId: user.roleId ?? null,
      organizationId,
    };

    this.cls.set('user', userData);
    this.cls.set('organizationId', organizationId);

    return userData;
  }
}
