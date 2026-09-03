export interface EnvConfig {
  env: string;
  isLocal: boolean;
  isStage: boolean;
  isLive: boolean;
  apiUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  debug: boolean;
}

export const ENVIRONMENTS: {
  readonly LOCAL: 'local';
  readonly STAGE: 'stage';
  readonly LIVE: 'live';
};

export const envConfig: EnvConfig;
export default envConfig;
