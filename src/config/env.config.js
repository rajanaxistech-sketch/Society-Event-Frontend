/**
 * Environment-Based API & App Configuration System
 * 
 * Supports three primary deployment targets:
 * - 'local'  -> Local development server (http://localhost:6090/api/v1)
 * - 'stage'  -> Staging / QA pre-release environment (https://api-societymgmt.anaxistech.com/api/v1)
 * - 'live'   -> Production client-facing environment (https://api-societymgmt.anaxistech.com/api/v1)
 * 
 * Complies with Create React App (REACT_APP_*) while safely falling back to standard variables.
 */

// Supported environments enum
export const ENVIRONMENTS = Object.freeze({
  LOCAL: "local",
  STAGE: "stage",
  LIVE: "live",
});

// Default API Base URLs per environment
const DEFAULT_API_URLS = Object.freeze({
  [ENVIRONMENTS.LOCAL]: "http://localhost:6090/api/v1",
  [ENVIRONMENTS.STAGE]: "https://api-societymgmt.anaxistech.com/api/v1",
  [ENVIRONMENTS.LIVE]: "https://api-societymgmt.anaxistech.com/api/v1",
});

/**
 * Resolves current environment string from environment variables
 */
function resolveEnvironment() {
  const rawEnv = (
    process.env.REACT_APP_ENV ||
    process.env.REACT_APP_ENVIRONMENT ||
    process.env.REACT_APP_STAGE ||
    process.env.NODE_ENV ||
    ENVIRONMENTS.LOCAL
  )
    .toLowerCase()
    .trim();

  if (rawEnv === "production" || rawEnv === "prod" || rawEnv === "live") {
    return ENVIRONMENTS.LIVE;
  }
  if (rawEnv === "staging" || rawEnv === "stage" || rawEnv === "test") {
    return ENVIRONMENTS.STAGE;
  }
  if (rawEnv === "development" || rawEnv === "dev" || rawEnv === "local") {
    return ENVIRONMENTS.LOCAL;
  }

  console.warn(
    `[EnvConfig] Unrecognized environment "${rawEnv}". Defaulting to "${ENVIRONMENTS.LOCAL}". Valid values: local, stage, live.`
  );
  return ENVIRONMENTS.LOCAL;
}

/**
 * Resolves API URL with environment-safety checks
 */
function resolveApiUrl(currentEnv) {
  const customUrl = (
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_API_URL ||
    ""
  ).trim();

  // If a custom URL is provided via .env, strip trailing slash and return it
  if (customUrl) {
    return customUrl.replace(/\/+$/, "");
  }

  return DEFAULT_API_URLS[currentEnv] || DEFAULT_API_URLS[ENVIRONMENTS.LOCAL];
}

// Current active environment
const currentEnv = resolveEnvironment();
const apiUrl = resolveApiUrl(currentEnv);

/**
 * Immutable global environment configuration object
 */
export const envConfig = Object.freeze({
  env: currentEnv,
  isLocal: currentEnv === ENVIRONMENTS.LOCAL,
  isStage: currentEnv === ENVIRONMENTS.STAGE,
  isLive: currentEnv === ENVIRONMENTS.LIVE,
  apiUrl,
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "30000", 10),
  appName: process.env.REACT_APP_NAME || "Society Event Management",
  appVersion: process.env.REACT_APP_VERSION || "1.0.0",
  debug: currentEnv !== ENVIRONMENTS.LIVE,
});

export default envConfig;
