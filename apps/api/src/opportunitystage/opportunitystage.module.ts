import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { OpportunityStageController } from './opportunitystage.controller';
import { OpportunityStageService } from './opportunitystage.service';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [OpportunityStageController],
  providers: [OpportunityStageService],
  exports: [OpportunityStageService],
})
export class OpportunityStageModule {}
