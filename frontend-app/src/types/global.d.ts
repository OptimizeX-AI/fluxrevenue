// src/types/global.d.ts

declare global {
  interface Window {
    FluxConfig?: {
      supabase: {
        url: string;
        anonKey: string;
        options: {
          auth: {
            persistSession: boolean;
            detectSessionInUrl: boolean;
            storageKey: string;
          };
        };
      };
      flux: {
        domain: string;
        cookieOptions: {
          domain: string;
          secure: boolean;
          sameSite: string;
          path: string;
        };
      };
      app: {
        url: string;
        loginUrl: string;
        signupUrl: string;
      };
      redirectToLogin?: () => void;
      initialized: boolean;
    };
    supabase?: any;
    fluxConfig?: any;
    redirectToLogin?: () => void;
    get_flux_token?: () => Promise<string | null>;
    set_flux_token?: () => void;
  }
}

// ✅ IMPORTANTE: Arquivo deve ter pelo menos uma exportação
export {};
