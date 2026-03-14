import { SetMetadata } from '@nestjs/common';
import { FeatureFlag } from './feature-flag.enum';

export const REQUIRE_FEATURE_FLAGS_KEY = 'requireFeatureFlags';

export type FeatureFlagMode = 'all' | 'any';

export interface RequireFeatureFlagsMetadata {
  flags: FeatureFlag[];
  mode: FeatureFlagMode;
}

export const RequireFeatureFlags = (
  flags: FeatureFlag[],
  mode: FeatureFlagMode = 'all',
) =>
  SetMetadata(REQUIRE_FEATURE_FLAGS_KEY, {
    flags,
    mode,
  } as RequireFeatureFlagsMetadata);
