import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { checkPassword, excludePassword } from '@workspace/shared/schemas';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await checkPassword(password, user.password)) && user.active) {
      await this.usersService.update(user.id, { lastLogin: new Date() });
      const result = excludePassword(user);
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
