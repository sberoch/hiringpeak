import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, tap } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import type {
  AuditClientInfo,
  AuditContext,
  AuditEntityRef,
  AuditMetadata,
} from '@workspace/shared/types/audit-log';
import {
  AUDIT_ACTION_KEY,
  type AuditActionOptions,
  type LabelPath,
} from './audit-action.decorator';
import { AuditService } from './audit.service';
import type { CurrentUserStore } from '../auth/auth.currentuser.store';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService<CurrentUserStore>,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & {
        params?: { id?: string };
        method?: string;
        ip?: string;
        socket?: { remoteAddress?: string };
        headers: Headers | Record<string, string | string[] | undefined>;
      }
    >();
    const method = request.method?.toUpperCase();
    const isMutation =
      method === 'POST' || method === 'PATCH' || method === 'DELETE';
    const options = this.reflector.get<AuditActionOptions | undefined>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!isMutation || !options) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        const user = this.cls.get('user');
        const organizationId = this.cls.get('organizationId');
        if (!user?.id || organizationId == null) return;

        const actorUserId =
          typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        const entityId = this.resolveEntityId(request, result);
        const metadata = this.buildMetadata(request, result, options);

        void this.auditService.record({
          eventType: options.eventType,
          organizationId,
          actorUserId,
          entityType: options.entityType,
          entityId: entityId ?? null,
          metadata,
        });
      }),
    );
  }

  private resolveEntityId(
    request: Request & { params?: { id?: string } },
    result: unknown,
  ): number | undefined {
    const paramId = request.params?.id;
    if (paramId != null) {
      const n = parseInt(paramId, 10);
      if (!Number.isNaN(n)) return n;
    }
    const body = result as { id?: number } | null | undefined;
    if (
      Boolean(body) &&
      typeof body === 'object' &&
      typeof body.id === 'number'
    ) {
      return body.id;
    }
    return undefined;
  }

  private buildMetadata(
    request: {
      ip?: string;
      socket?: { remoteAddress?: string };
      headers: Headers | Record<string, string | string[] | undefined>;
    },
    result: unknown,
    options: AuditActionOptions,
  ): AuditMetadata | null {
    const context = this.buildContext(result, options);
    const client = this.buildClientInfo(request);

    if (!context && !client) return null;
    return {
      ...(context ? { context } : {}),
      ...(client ? { client } : {}),
    };
  }

  private buildContext(
    result: unknown,
    options: AuditActionOptions,
  ): AuditContext | undefined {
    if (!options.labelField && !options.relatedFields?.length) return undefined;

    const primary = options.labelField
      ? this.makeRef(options.entityType, result, options.labelField)
      : undefined;

    const related = options.relatedFields
      ?.map((rf) => this.makeRef(rf.type, result, rf.field))
      .filter((r): r is AuditEntityRef => r != null);

    if (!primary && !related?.length) return undefined;
    return {
      ...(primary ? { primary } : {}),
      ...(related?.length ? { related } : {}),
    };
  }

  private makeRef(
    type: string,
    source: unknown,
    path: LabelPath,
  ): AuditEntityRef | undefined {
    const value = readPath(source, path);
    if (value == null) return undefined;
    const label = String(value).trim();
    if (label.length === 0) return undefined;
    return { type, label };
  }

  private buildClientInfo(request: {
    ip?: string;
    socket?: { remoteAddress?: string };
    headers: Headers | Record<string, string | string[] | undefined>;
  }): AuditClientInfo | undefined {
    const ip =
      readHeader(request.headers, 'x-forwarded-for')?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket?.remoteAddress ||
      undefined;
    const userAgent = readHeader(request.headers, 'user-agent');
    if (!ip && !userAgent) return undefined;
    return {
      ...(ip ? { ip } : {}),
      ...(userAgent ? { userAgent } : {}),
    };
  }
}

function readPath(source: unknown, path: string): unknown {
  if (source == null || typeof source !== 'object') return undefined;
  const segments = path.split('.');
  let current: unknown = source;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

function readHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) ?? undefined;
  }
  const raw = (headers as Record<string, string | string[] | undefined>)[name];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
