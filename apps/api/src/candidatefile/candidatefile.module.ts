import { Module } from '@nestjs/common';
import { CandidateFileController } from './candidatefile.controller';
import { CandidateFileService } from './candidatefile.service';
import { DrizzleModule } from '../common/database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [CandidateFileController],
  providers: [CandidateFileService],
  exports: [CandidateFileService],
})
export class CandidateFileModule {}
