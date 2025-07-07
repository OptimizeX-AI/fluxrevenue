// src/utils/AuthCookieManager.ts
export class AuthCookieManager {
  private static readonly DOMAIN = '.fluxrevenue.com.br';
  private static readonly TOKEN_KEY = 'flux_access_token';
  private static readonly REFRESH_KEY = 'flux_refresh_token';

  static setTokens(accessToken: string, refreshToken: string, expiresAt: number): void {
    const maxAge = Math.floor((expiresAt * 1000 - Date.now()) / 1000);
    
    document.cookie = `${this.TOKEN_KEY}=${accessToken}; Domain=${this.DOMAIN}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
    document.cookie = `${this.REFRESH_KEY}=${refreshToken}; Domain=${this.DOMAIN}; path=/; max-age=${maxAge * 2}; SameSite=Lax; secure`;
  }

  static getAccessToken(): string | null {
    return this.getCookie(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return this.getCookie(this.REFRESH_KEY);
  }

  static clearTokens(): void {
    const expires = new Date(0).toUTCString();
    document.cookie = `${this.TOKEN_KEY}=; Domain=${this.DOMAIN}; path=/; expires=${expires}`;
    document.cookie = `${this.REFRESH_KEY}=; Domain=${this.DOMAIN}; path=/; expires=${expires}`;
  }

  private static getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }
}

