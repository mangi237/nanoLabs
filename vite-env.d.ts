interface ImportMetaEnv {
    readonly VITE_PINATA_API_KEY?: string;
    readonly VITE_PINATA_SECRET_API_KEY?: string;
    readonly [key: string]: any;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  