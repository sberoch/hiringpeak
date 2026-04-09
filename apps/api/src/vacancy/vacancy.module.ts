import { Module } from '@nestjs/common';
import { VacancyController } from './vacancy.controller';
import { VacancyService } from './vacancy.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationModule } from '../organization/organization.module';
import { VacancyReportService } from './vacancy-report.service';
import { VacancyAiService } from './vacancy-ai.service';
import { VacancyAiAnalyticsService } from './vacancy-ai.analytics.service';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';

@Module({
  imports: [DrizzleModule, AuthModule, OrganizationModule, FeatureFlagModule],
  controllers: [VacancyController],
  providers: [
    VacancyService,
    VacancyReportService,
    VacancyAiService,
    VacancyAiAnalyticsService,
  ],
  exports: [VacancyService],
})
export class VacancyModule {}
