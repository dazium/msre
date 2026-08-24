import { Capacitor } from "@capacitor/core";

export const DEPLOYED_CRM_ORIGIN = "https://roofcrm-lzqinayu.manus.space";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export function resolveApiOrigin(options: {
  configuredOrigin?: string;
  isNativePlatform: boolean;
  browserOrigin?: string;
}) {
  if (options.configuredOrigin) return trimTrailingSlash(options.configuredOrigin);
  if (options.isNativePlatform) return DEPLOYED_CRM_ORIGIN;
  return options.browserOrigin ? trimTrailingSlash(options.browserOrigin) : "";
}

export function getApiUrl(path: string) {
  const origin = resolveApiOrigin({
    configuredOrigin: import.meta.env.VITE_API_URL,
    isNativePlatform: Capacitor.isNativePlatform(),
    browserOrigin: globalThis.location?.origin,
  });
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export const isNativeMobileApp = () => Capacitor.isNativePlatform();
