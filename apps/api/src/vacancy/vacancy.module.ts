import { Module } from '@nestjs/common';
import { VacancyController } from './vacancy.controller';
import { VacancyService } from './vacancy.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationModule } from '../organization/organization.module';
import { VacancyReportService } from './vacancy-report.service';

@Module({
  imports: [DrizzleModule, AuthModule, OrganizationModule],
  controllers: [VacancyController],
  providers: [VacancyService, VacancyReportService],
  exports: [VacancyService],
})
export class VacancyModule {}
