import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { checkPassword, excludePassword } from '@workspace/shared/schemas';
import { UserRole } from '@workspace/shared/enums';
import type { LoginDto } from '@workspace/shared/dtos';
import type { AuthTokenData } from '@workspace/shared/types/auth';

const WEB_ROLES: string[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.BASIC];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await checkPassword(password, user.password)) && user.active) {
      await this.usersService.updateLastLogin(user.id);
      const result = excludePassword(user);
      return result;
    }
    return null;
  }

  /**
   * Validates user and origin: web requires org user (ADMIN/MANAGER/BASIC with organizationId);
   * backoffice requires SYSTEM_ADMIN with no org.
   */
  async validateUserWithOrigin(
    email: string,
    password: string,
    origin: 'web' | 'backoffice',
  ): Promise<any> {
    let user: any;
    try {
      user = await this.usersService.findOneByEmail(email);
    } catch {
      return null;
    }
    if (
      !user ||
      !(await checkPassword(password, user.password)) ||
      !user.active
    ) {
      return null;
    }
    const organizationId = user.organizationId ?? null;
    const role = user.role as string;

    if (origin === 'web') {
      if (organizationId == null || !WEB_ROLES.includes(role)) {
        return null;
      }
    } else if (origin === 'backoffice') {
      if (role !== UserRole.SYSTEM_ADMIN || organizationId != null) {
        return null;
      }
    } else {
      return null;
    }

    await this.usersService.updateLastLogin(user.id);
    return excludePassword(user);
  }

  async login(user: any) {
    const payload: Omit<AuthTokenData, 'iat'> = {
      active: Boolean(user.active),
      id: Number(user.id),
      email: user.email ?? undefined,
      role: user.role,
      name: user.name,
      organizationId: user.organizationId ?? null,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginWithOrigin(loginDto: LoginDto) {
    const { email, password, origin } = loginDto;
    this.logger.log(`loginDto: ${JSON.stringify(loginDto)}`);
    const user = await this.validateUserWithOrigin(
      email,
      password,
      origin ?? 'web',
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.login(user);
  }

  /**
   * Verify Google id_token, find user by email, apply web-origin rules, return JWT.
   * No user creation; user must exist with organizationId and role in WEB_ROLES.
   */
  async loginWithGoogle(idToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      this.logger.warn('GOOGLE_CLIENT_ID not set');
      throw new UnauthorizedException();
    }
    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: clientId });
    } catch (err) {
      this.logger.warn('Google id_token verification failed', err);
      throw new UnauthorizedException();
    }
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedException();
    }
    const email = payload.email;
    let user: any;
    try {
      user = await this.usersService.findOneByEmail(email);
    } catch {
      throw new UnauthorizedException();
    }
    if (!user?.active) {
      throw new UnauthorizedException();
    }
    const organizationId = user.organizationId ?? null;
    const role = user.role as string;
    if (organizationId == null || !WEB_ROLES.includes(role)) {
      throw new UnauthorizedException();
    }
    await this.usersService.updateLastLogin(user.id);
    return this.login(excludePassword(user));
  }
}
