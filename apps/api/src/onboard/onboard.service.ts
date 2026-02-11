import { Inject, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { UserRole } from '@workspace/shared/enums';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { CurrentUserStore } from '../auth/auth.currentuser.store';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { OnboardOrganizationDto } from './onboard.dto';

@Injectable()
export class OnboardService {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly cls: ClsService<CurrentUserStore>,
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
  ) {}

  async onboardOrganization(dto: OnboardOrganizationDto) {
    return this.db.transaction(async (tx) => {
      const organization = await this.organizationService.create(
        { name: dto.organizationName },
        { tx },
      );

      this.cls.set('organizationId', organization.id);

      const user = await this.userService.create(
        {
          email: dto.email,
          password: dto.password,
          name: dto.name,
          role: UserRole.ADMIN,
        },
        organization.id,
        { tx },
      );

      return { organization, user };
    });
  }
}
