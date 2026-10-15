import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { LostReasonController } from './lostreason.controller';
import { LostReasonService } from './lostreason.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [LostReasonController],
  providers: [LostReasonService],
  exports: [LostReasonService],
})
export class LostReasonModule {}
