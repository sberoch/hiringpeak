import { Test } from '@nestjs/testing';
import { AuditLogService } from '../../../audit-log/audit-log.service';
import { AuditService } from '../../../audit-log/audit.service';
import { AuthzService } from '../../../auth/authz/authz.service';
import { BrandingService } from '../../../branding/branding.service';
import { CandidateService } from '../../../candidate/candidate.service';
import { CompanyService } from '../../../company/company.service';
import { DashboardService } from '../../../dashboard/dashboard.service';
import { ContactService } from '../../../contact/contact.service';
import { ContactSourceService } from '../../../contactsource/contactsource.service';
import { InteractionService } from '../../../interaction/interaction.service';
import { LostReasonService } from '../../../lostreason/lostreason.service';
import { NotificationFactory } from '../../../notification/notification-factory';
import { NotificationService } from '../../../notification/notification.service';
import { OpportunityService } from '../../../opportunity/opportunity.service';
import { OpportunityStageService } from '../../../opportunitystage/opportunitystage.service';
import { PermissionService } from '../../../permission/permission.service';
import { PreferencesService } from '../../../preferences/preferences.service';
import { RoleService } from '../../../role/role.service';
import { TaskService } from '../../../task/task.service';
import { UserService } from '../../../user/user.service';
import { VacancyService } from '../../../vacancy/vacancy.service';
import { DrizzleProvider } from '../drizzle.module';
import type { DrizzleDatabase } from '../types/drizzle';

const SERVICES = [
  AuditLogService,
  AuditService,
  AuthzService,
  BrandingService,
  CandidateService,
  CompanyService,
  ContactService,
  DashboardService,
  ContactSourceService,
  InteractionService,
  LostReasonService,
  NotificationFactory,
  NotificationService,
  OpportunityService,
  OpportunityStageService,
  PermissionService,
  PreferencesService,
  RoleService,
  TaskService,
  UserService,
  VacancyService,
];

/** The real services, wired to the given (test) database. */
export async function testServices(db: DrizzleDatabase) {
  const module = await Test.createTestingModule({
    providers: [...SERVICES, { provide: DrizzleProvider, useValue: db }],
  }).compile();
  return {
    audit: module.get(AuditService),
    auditLog: module.get(AuditLogService),
    authz: module.get(AuthzService),
    branding: module.get(BrandingService),
    candidates: module.get(CandidateService),
    companies: module.get(CompanyService),
    contacts: module.get(ContactService),
    contactSources: module.get(ContactSourceService),
    dashboard: module.get(DashboardService),
    interactions: module.get(InteractionService),
    lostReasons: module.get(LostReasonService),
    notifications: module.get(NotificationService),
    opportunities: module.get(OpportunityService),
    preferences: module.get(PreferencesService),
    roles: module.get(RoleService),
    stages: module.get(OpportunityStageService),
    tasks: module.get(TaskService),
    vacancies: module.get(VacancyService),
  };
}
