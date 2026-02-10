import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureFlag } from './feature-flag.enum';
import { FEATURE_FLAG_ENV_MAP } from './feature-flag.constants';

@Injectable()
export class FeatureFlagService {
  constructor(private readonly configService: ConfigService) {}

  async isEnabled(flag: FeatureFlag): Promise<boolean> {
    const envKey = FEATURE_FLAG_ENV_MAP[flag];
    const value = this.configService.get<string>(envKey);
    if (value === undefined || value === null) {
      return true;
    }
    return value.toLowerCase() !== 'false';
  }
}
