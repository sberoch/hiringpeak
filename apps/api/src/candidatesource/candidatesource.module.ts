import { Module } from '@nestjs/common';
import { CandidateSourceController } from './candidatesource.controller';
import { CandidateSourceService } from './candidatesource.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [CandidateSourceController],
  providers: [CandidateSourceService],
  exports: [CandidateSourceService],
})
export class CandidateSourceModule {}
