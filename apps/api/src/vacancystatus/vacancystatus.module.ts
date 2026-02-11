import { Module } from '@nestjs/common';
import { VacancyStatusController } from './vacancystatus.controller';
import { VacancyStatusService } from './vacancystatus.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [VacancyStatusController],
  providers: [VacancyStatusService],
  exports: [VacancyStatusService],
})
export class VacancyStatusModule {}
