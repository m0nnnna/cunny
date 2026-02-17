import { createContext, useContext } from 'react';
import { DEFAULT_BRAND_NAME } from '../config/brand';

export type HashRouterConfig = {
  enabled?: boolean;
  basename?: string;
};

export type ClientConfig = {
  /** Display name for the app (UI only). Overrides VITE_BRAND_NAME from .env when set in config.json */
  brandName?: string;
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

export const clientDefaultServer = (clientConfig: ClientConfig): string =>
  clientConfig.homeserverList?.[clientConfig.defaultHomeserver ?? 0] ?? 'matrix.org';

export const clientAllowedServer = (clientConfig: ClientConfig, server: string): boolean => {
  const { homeserverList, allowCustomHomeservers } = clientConfig;

  if (allowCustomHomeservers) return true;

  return homeserverList?.includes(server) === true;
};
