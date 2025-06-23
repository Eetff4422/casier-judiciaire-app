/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_WS: string;
  // Ajoute ici d’autres variables d’environnement si besoin
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
