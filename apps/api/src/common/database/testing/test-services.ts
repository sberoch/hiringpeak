import { Test } from '@nestjs/testing';
import { AuditLogService } from '../../../audit-log/audit-log.service';
import { AuthzService } from '../../../auth/authz/authz.service';
import { CompanyService } from '../../../company/company.service';
import { ContactService } from '../../../contact/contact.service';
import { ContactSourceService } from '../../../contactsource/contactsource.service';
import { InteractionService } from '../../../interaction/interaction.service';
import { LostReasonService } from '../../../lostreason/lostreason.service';
import { NotificationFactory } from '../../../notification/notification-factory';
import { NotificationService } from '../../../notification/notification.service';
import { OpportunityService } from '../../../opportunity/opportunity.service';
import { OpportunityStageService } from '../../../opportunitystage/opportunitystage.service';
import { PermissionService } from '../../../permission/permission.service';
import { RoleService } from '../../../role/role.service';
import { TaskService } from '../../../task/task.service';
import { UserService } from '../../../user/user.service';
import { VacancyService } from '../../../vacancy/vacancy.service';
import { DrizzleProvider } from '../drizzle.module';
import type { DrizzleDatabase } from '../types/drizzle';

const SERVICES = [
  AuditLogService,
  AuthzService,
  CompanyService,
  ContactService,
  ContactSourceService,
  InteractionService,
  LostReasonService,
  NotificationFactory,
  NotificationService,
  OpportunityService,
  OpportunityStageService,
  PermissionService,
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
    auditLog: module.get(AuditLogService),
    authz: module.get(AuthzService),
    companies: module.get(CompanyService),
    contacts: module.get(ContactService),
    contactSources: module.get(ContactSourceService),
    interactions: module.get(InteractionService),
    lostReasons: module.get(LostReasonService),
    notifications: module.get(NotificationService),
    opportunities: module.get(OpportunityService),
    stages: module.get(OpportunityStageService),
    tasks: module.get(TaskService),
    vacancies: module.get(VacancyService),
  };
}
