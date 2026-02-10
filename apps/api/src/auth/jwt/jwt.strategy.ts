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
    let organizationId: number | undefined;
    try {
      const user = await this.userService.findOne(userId);
      const orgId = (user as unknown as { organizationId: number | null })
        .organizationId;
      organizationId = orgId ?? undefined;
    } catch {
      return null;
    }

    const userData = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      active: payload.active,
      organizationId,
    };

    this.cls.set('user', userData);
    this.cls.set('organizationId', organizationId);

    return userData;
  }
}
