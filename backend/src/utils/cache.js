/**
 * In-memory TTL Cache Engine
 * Provides ultra-fast caching for frequently read / semi-static data:
 * - Product catalogs, color codes, categories
 * - Dashboard aggregates & target indicators
 * - Policy configs & system lookups
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0 };
    // Auto-clean expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
    return value;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return item.value;
  }

  del(key) {
    return this.store.delete(key);
  }

  flush(prefix = '') {
    if (!prefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  async wrap(key, fetcher, ttlSeconds = 60) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetcher();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

const globalCache = new MemoryCache();

module.exports = globalCache;
