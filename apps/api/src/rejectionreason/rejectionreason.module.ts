import { Module } from '@nestjs/common';
import { RejectionReasonController } from './rejectionreason.controller';
import { RejectionReasonService } from './rejectionreason.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [RejectionReasonController],
  providers: [RejectionReasonService],
  exports: [RejectionReasonService],
})
export class RejectionReasonModule {}
