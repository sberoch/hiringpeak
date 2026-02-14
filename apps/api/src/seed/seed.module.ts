import { Module } from '@nestjs/common';
import { DrizzleModule } from '../common/database/drizzle.module';
import { RoleModule } from '../role/role.module';
import { SeedService } from './seed.service';

@Module({
  imports: [DrizzleModule, RoleModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
