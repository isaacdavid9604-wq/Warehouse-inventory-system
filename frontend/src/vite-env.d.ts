/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_LOW_STOCK_THRESHOLD?: string;
  readonly VITE_WAREHOUSE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
