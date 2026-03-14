import { Module } from '@nestjs/common';
import { SeniorityController } from './seniority.controller';
import { SeniorityService } from './seniority.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [SeniorityController],
  providers: [SeniorityService],
  exports: [SeniorityService],
})
export class SeniorityModule {}
