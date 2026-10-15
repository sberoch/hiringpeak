import { Module } from '@nestjs/common';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationModule } from '../organization/organization.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { OpportunityStageModule } from '../opportunitystage/opportunitystage.module';
import { LostReasonModule } from '../lostreason/lostreason.module';
import { OnboardController } from './onboard.controller';
import { OnboardService } from './onboard.service';

@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    OrganizationModule,
    RoleModule,
    UserModule,
    OpportunityStageModule,
    LostReasonModule,
  ],
  controllers: [OnboardController],
  providers: [OnboardService],
})
export class OnboardModule {}
