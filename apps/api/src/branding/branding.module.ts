import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from '../common/database/drizzle.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';

@Module({
  imports: [DrizzleModule, AuthModule, AuditLogModule],
  controllers: [BrandingController],
  providers: [BrandingService],
  exports: [BrandingService],
})
export class BrandingModule {}
