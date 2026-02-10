import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_FEATURE_FLAGS_KEY,
  type RequireFeatureFlagsMetadata,
} from './feature-flag.decorator';
import { FeatureFlagService } from './feature-flag.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<
      RequireFeatureFlagsMetadata | undefined
    >(REQUIRE_FEATURE_FLAGS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata?.flags?.length) {
      return true;
    }

    const results = await Promise.all(
      metadata.flags.map((flag) => this.featureFlagService.isEnabled(flag)),
    );

    const satisfied =
      metadata.mode === 'all'
        ? results.every(Boolean)
        : results.some(Boolean);

    if (!satisfied) {
      throw new ServiceUnavailableException('Feature is not enabled');
    }

    return true;
  }
}
