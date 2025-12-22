import { Module } from '@nestjs/common';
import { CandidateVacancyStatusController } from './candidatevacancystatus.controller';
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [CandidateVacancyStatusController],
  providers: [CandidateVacancyStatusService],
  exports: [CandidateVacancyStatusService],
})
export class CandidateVacancyStatusModule {}
