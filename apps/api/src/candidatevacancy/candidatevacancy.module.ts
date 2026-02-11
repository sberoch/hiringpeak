import { Module } from '@nestjs/common';
import { CandidateVacancyController } from './candidatevacancy.controller';
import { CandidateVacancyService } from './candidatevacancy.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [CandidateVacancyController],
  providers: [CandidateVacancyService],
  exports: [CandidateVacancyService],
})
export class CandidateVacancyModule {}
