import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';
import { LocalStrategy } from './local/local.strategy';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { OrganizationGuard } from './organization/organization.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    FeatureFlagModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, OrganizationGuard],
  exports: [AuthService, JwtModule, OrganizationGuard],
})
export class AuthModule {}
