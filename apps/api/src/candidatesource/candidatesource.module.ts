import { Module } from '@nestjs/common';
import { CandidateSourceController } from './candidatesource.controller';
import { CandidateSourceService } from './candidatesource.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [CandidateSourceController],
  providers: [CandidateSourceService],
  exports: [CandidateSourceService],
})
export class CandidateSourceModule {}
