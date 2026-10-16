import {
  Controller,
  Get,
  Header,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AUDIT_ENTITY_LABELS,
  AUDIT_EVENT_LABELS,
  type AuditLogItem,
} from '@workspace/shared/types/audit-log';
import { PermissionCode } from '@workspace/shared/enums';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';
import { CurrentUser } from '../auth/auth.decorators';
import { AuthzService } from '../auth/authz/authz.service';
import type { Response } from 'express';
import { OrganizationGuard } from '../auth/organization/organization.guard';
import { OrganizationId } from '../auth/organization/organization.decorator';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions/permissions.guard';
import { AuditLogQueryParams } from './audit-log.dto';
import { AuditLogService } from './audit-log.service';

@ApiBearerAuth()
@UseGuards(OrganizationGuard, PermissionsGuard)
@ApiTags('Audit Log')
@Controller('audit-log')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly authzService: AuthzService,
  ) {}

  /** Commercial events reach only callers with commercial access. */
  private async commercialAccess(user: { id: string | number }) {
    const userId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    return hasCommercialAccess(
      await this.authzService.getPermissionCodesForUser(userId),
    );
  }

  @ApiOkResponse()
  @Get()
  @Permissions(PermissionCode.AUDIT_LOG_READ)
  async findAll(
    @Query() query: AuditLogQueryParams,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
  ) {
    return this.auditLogService.findAll({
      ...query,
      organizationId,
      commercialAccess: await this.commercialAccess(user),
    });
  }

  @ApiOkResponse()
  @Get('export')
  @Permissions(PermissionCode.AUDIT_LOG_READ)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @Query() query: AuditLogQueryParams,
    @OrganizationId() organizationId: number,
    @CurrentUser() user: { id: string | number },
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const items = await this.auditLogService.findAllForExport({
      ...query,
      organizationId,
      commercialAccess: await this.commercialAccess(user),
    });
    const csv = toCsv(items);
    const fileName = `registro-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    res.set('Content-Disposition', `attachment; filename="${fileName}"`);
    return new StreamableFile(Buffer.from('﻿' + csv, 'utf-8'));
  }
}

const CSV_HEADERS = [
  'Fecha',
  'Usuario',
  'Email',
  'Acción',
  'Tipo de entidad',
  'Detalle',
  'Relacionados',
  'IP',
];

function toCsv(items: AuditLogItem[]): string {
  const lines = [CSV_HEADERS.map(csvEscape).join(',')];
  for (const item of items) {
    const primary = item.metadata?.context?.primary?.label ?? '';
    const related =
      item.metadata?.context?.related
        ?.map((r) => `${AUDIT_ENTITY_LABELS[r.type] ?? r.type}: ${r.label}`)
        .join('; ') ?? '';
    const row = [
      new Date(item.createdAt).toLocaleString('es-AR'),
      item.actorName ?? '',
      item.actorEmail ?? '',
      AUDIT_EVENT_LABELS[item.eventType] ?? item.eventType,
      AUDIT_ENTITY_LABELS[item.entityType] ?? item.entityType,
      primary,
      related,
      item.metadata?.client?.ip ?? '',
    ];
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\r\n');
}

function csvEscape(value: string): string {
  if (value == null) return '""';
  const needsQuoting = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}
