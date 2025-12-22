import { Module } from '@nestjs/common';
import { VacancyStatusController } from './vacancystatus.controller';
import { VacancyStatusService } from './vacancystatus.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [VacancyStatusController],
  providers: [VacancyStatusService],
  exports: [VacancyStatusService],
})
export class VacancyStatusModule {}
