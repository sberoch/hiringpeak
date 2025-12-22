import { Module } from '@nestjs/common';
import { SeniorityController } from './seniority.controller';
import { SeniorityService } from './seniority.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [SeniorityController],
  providers: [SeniorityService],
  exports: [SeniorityService],
})
export class SeniorityModule {}
