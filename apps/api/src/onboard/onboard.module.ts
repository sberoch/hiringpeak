import { Module } from '@nestjs/common';
import { DrizzleModule } from '../common/database/drizzle.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { OnboardController } from './onboard.controller';
import { OnboardService } from './onboard.service';

@Module({
  imports: [DrizzleModule, OrganizationModule, UserModule],
  controllers: [OnboardController],
  providers: [OnboardService],
})
export class OnboardModule {}
