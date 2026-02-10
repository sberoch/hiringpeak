import { Module } from '@nestjs/common';
import { FeatureFlagGuard } from './feature-flag.guard';
import { FeatureFlagService } from './feature-flag.service';

@Module({
  providers: [FeatureFlagService, FeatureFlagGuard],
  exports: [FeatureFlagService, FeatureFlagGuard],
})
export class FeatureFlagModule {}
