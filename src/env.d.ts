/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA4_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __mackysoftSkipInitialPageView?: boolean;
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
