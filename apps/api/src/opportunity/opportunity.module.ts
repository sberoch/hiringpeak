import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { LostReasonModule } from '../lostreason/lostreason.module';
import { VacancyModule } from '../vacancy/vacancy.module';
import { OpportunityStageModule } from '../opportunitystage/opportunitystage.module';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';

@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    OpportunityStageModule,
    LostReasonModule,
    VacancyModule,
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
