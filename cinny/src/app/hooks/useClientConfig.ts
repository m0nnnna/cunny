import { createContext, useContext } from 'react';
import { DEFAULT_APP_VERSION, DEFAULT_BRAND_NAME } from '../config/brand';

export type HashRouterConfig = {
  enabled?: boolean;
  basename?: string;
};

export type ClientConfig = {
  /** Display name for the app (UI only). Set in config.json or .env (VITE_BRAND_NAME). */
  brandName?: string;
  /** App version (UI only). Set in config.json or .env (VITE_APP_VERSION). */
  appVersion?: string;
  /** Show the neko mascot in Neko themes. Default true. Set to false in config.json to hide. */
  showNekoMascot?: boolean;
  defaultHomeserver?: number;
  homeserverList?: string[];
  allowCustomHomeservers?: boolean;

  featuredCommunities?: {
    openAsDefault?: boolean;
    spaces?: string[];
    rooms?: string[];
    servers?: string[];
  };

  hashRouter?: HashRouterConfig;
};

const ClientConfigContext = createContext<ClientConfig | null>(null);

export const ClientConfigProvider = ClientConfigContext.Provider;

export function useClientConfig(): ClientConfig {
  const config = useContext(ClientConfigContext);
  if (!config) throw new Error('Client config are not provided!');
  return config;
}

/** Display brand name (UI only). Prefers config.brandName, then VITE_BRAND_NAME from .env, then default. */
export function useBrandName(): string {
  const config = useContext(ClientConfigContext);
  const fromConfig = config?.brandName?.trim();
  return fromConfig || DEFAULT_BRAND_NAME;
}

/** App version (UI only). Prefers config.appVersion, then VITE_APP_VERSION from .env, then default. */
export function useAppVersion(): string {
  const config = useContext(ClientConfigContext);
  const fromConfig = config?.appVersion?.trim();
  return fromConfig || DEFAULT_APP_VERSION;
}

export const clientDefaultServer = (clientConfig: ClientConfig): string =>
  clientConfig.homeserverList?.[clientConfig.defaultHomeserver ?? 0] ?? 'matrix.org';

export const clientAllowedServer = (clientConfig: ClientConfig, server: string): boolean => {
  const { homeserverList, allowCustomHomeservers } = clientConfig;

  if (allowCustomHomeservers) return true;

  return homeserverList?.includes(server) === true;
};
