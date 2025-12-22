import { Module } from '@nestjs/common';
import { CandidateVacancyController } from './candidatevacancy.controller';
import { CandidateVacancyService } from './candidatevacancy.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [CandidateVacancyController],
  providers: [CandidateVacancyService],
  exports: [CandidateVacancyService],
})
export class CandidateVacancyModule {}
