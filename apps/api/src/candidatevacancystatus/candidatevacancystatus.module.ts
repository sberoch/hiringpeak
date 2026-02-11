import { Module } from '@nestjs/common';
import { CandidateVacancyStatusController } from './candidatevacancystatus.controller';
import { CandidateVacancyStatusService } from './candidatevacancystatus.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [CandidateVacancyStatusController],
  providers: [CandidateVacancyStatusService],
  exports: [CandidateVacancyStatusService],
})
export class CandidateVacancyStatusModule {}
