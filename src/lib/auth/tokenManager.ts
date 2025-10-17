import { getNeonAuthToken } from '@/lib/neonAuth';

type CachedToken = {
  token: string;
  expiresAt: number;
};

export class TokenManager {
  private cache: CachedToken | null = null;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a valid token, using cache when possible.
   * If cache is missing/expired, attempt to fetch using getNeonAuthToken().
   */
  async getToken(): Promise<string | null> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      return this.cache.token;
    }

    // Attempt to retrieve via existing helper
    try {
      const token = await getNeonAuthToken();
      if (!token) return null;
      // Cache with default TTL
      this.setToken(token, this.defaultTTL);
      return token;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('TokenManager.getToken: failed to retrieve token', err);
      return null;
    }
  }

  /**
   * Explicitly set a token with optional TTL (ms).
   */
  setToken(token: string, ttlMs?: number) {
    const ttl = typeof ttlMs === 'number' ? ttlMs : this.defaultTTL;
    this.cache = {
      token,
      expiresAt: Date.now() + ttl,
    };
  }

  /**
   * Clear cached token (e.g., on logout).
   */
  clearToken() {
    this.cache = null;
  }

  /**
   * Check whether cached token is expired or missing.
   */
  isExpired(): boolean {
    return !this.cache || Date.now() >= this.cache.expiresAt;
  }
}

export const tokenManager = new TokenManager();