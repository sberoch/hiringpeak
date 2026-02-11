import { Module } from '@nestjs/common';
import { IndustryController } from './industry.controller';
import { IndustryService } from './industry.service';
import { DrizzleModule } from '../common/database/drizzle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [IndustryController],
  providers: [IndustryService],
  exports: [IndustryService],
})
export class IndustryModule {}
