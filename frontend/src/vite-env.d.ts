/// <reference types="vite/client" />

// Every variable declared here is PUBLIC (embedded in the bundle). Never add secrets.
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
