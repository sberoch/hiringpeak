import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, tap } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import {
  AUDIT_ACTION_KEY,
  type AuditActionOptions,
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
    const request = context
      .switchToHttp()
      .getRequest<Request & { params?: { id?: string }; method?: string }>();
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

        void this.auditService.record({
          eventType: options.eventType,
          organizationId,
          actorUserId,
          entityType: options.entityType,
          entityId: entityId ?? null,
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
}
