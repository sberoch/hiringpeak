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
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthzService } from './authz/authz.service';
import { PermissionsGuard } from './permissions/permissions.guard';
import { InternalUserGuard } from './internal-user.guard';
import { PermissionModule } from '../permission/permission.module';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    forwardRef(() => PermissionModule),
    DrizzleModule,
    FeatureFlagModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, OrganizationGuard, AuthzService, PermissionsGuard, InternalUserGuard],
  exports: [AuthService, JwtModule, OrganizationGuard, AuthzService, PermissionsGuard, InternalUserGuard],
})
export class AuthModule {}
