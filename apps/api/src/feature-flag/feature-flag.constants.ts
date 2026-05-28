import { FeatureFlag } from './feature-flag.enum';

/**
 * Maps each feature flag to the env variable name used to resolve its state.
 * Flags without env today can use FEATURE_<NAME> or be resolved from DB later.
 */
export const FEATURE_FLAG_ENV_MAP: Record<FeatureFlag, string> = {
  [FeatureFlag.LOGIN_ENABLED]: 'LOGIN_ENABLED',
  [FeatureFlag.GOOGLE_LOGIN_ENABLED]: 'GOOGLE_LOGIN_ENABLED',
  [FeatureFlag.ADVANCED_ANALYTICS]: 'FEATURE_ADVANCED_ANALYTICS',
  [FeatureFlag.BETA_DASHBOARD]: 'FEATURE_BETA_DASHBOARD',
  [FeatureFlag.AI_VACANCY_FLOW]: 'FEATURE_AI_VACANCY_FLOW',
  [FeatureFlag.AI_VACANCY_PERSISTENCE]: 'FEATURE_AI_VACANCY_PERSISTENCE',
};
