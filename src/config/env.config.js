/**
 * Environment-Based API & App Configuration System
 * 
 * Supports three primary deployment targets:
 * - 'local'  -> Local development server / mock services
 * - 'stage'  -> Staging / QA pre-release environment
 * - 'live'   -> Production client-facing environment
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
  [ENVIRONMENTS.LOCAL]: "http://localhost:5000/api",
  [ENVIRONMENTS.STAGE]: "https://stage-api.societyevents.com/api",
  [ENVIRONMENTS.LIVE]: "https://api.societyevents.com/api",
});

/**
 * Resolves current environment string from environment variables
 */
function resolveEnvironment() {
  const rawEnv = (
    process.env.REACT_APP_ENV ||
    process.env.NODE_ENV ||
    ENVIRONMENTS.LOCAL
  ).toLowerCase().trim();

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
  const customUrl = process.env.REACT_APP_API_URL?.trim();

  // If a custom URL is provided via .env, check for safety
  const resolvedUrl = customUrl || DEFAULT_API_URLS[currentEnv];

  // Safeguard: Live environment must never point to localhost
  if (currentEnv === ENVIRONMENTS.LIVE) {
    const isLocalhost =
      resolvedUrl.includes("localhost") ||
      resolvedUrl.includes("127.0.0.1") ||
      resolvedUrl.startsWith("http://192.168.") ||
      resolvedUrl.startsWith("http://10.");

    if (isLocalhost) {
      const errorMsg = `[CRITICAL SECURITY ALERT] Production/Live environment cannot point to a local address: "${resolvedUrl}". Please configure a valid live API URL in REACT_APP_API_URL.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  return resolvedUrl;
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
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "15000", 10),
  appName: process.env.REACT_APP_NAME || "Society Event Management",
  appVersion: process.env.REACT_APP_VERSION || "1.0.0",
  debug: currentEnv !== ENVIRONMENTS.LIVE,
});

export default envConfig;
