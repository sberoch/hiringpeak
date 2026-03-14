import { Module } from '@nestjs/common';
import { CandidateFileController } from './candidatefile.controller';
import { CandidateFileService } from './candidatefile.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [CandidateFileController],
  providers: [CandidateFileService],
  exports: [CandidateFileService],
})
export class CandidateFileModule {}
