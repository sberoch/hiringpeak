import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyReportService } from './company-report.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { VacancyModule } from '../vacancy/vacancy.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [DrizzleModule, AuthModule, VacancyModule, OrganizationModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyReportService],
  exports: [CompanyService],
})
export class CompanyModule {}
