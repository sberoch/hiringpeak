import { Module, forwardRef } from '@nestjs/common';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionModule } from '../permission/permission.module';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [DrizzleModule, forwardRef(() => AuthModule), PermissionModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
