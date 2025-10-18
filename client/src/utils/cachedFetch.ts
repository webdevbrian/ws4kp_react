type CacheEntry<T> = {
  expiry: number;
  promise?: Promise<T>;
  data?: T;
};

const cache = new Map<string, CacheEntry<any>>();

const now = () => Date.now();

export async function cachedJson<T = any>(url: string, ttlMs: number): Promise<T> {
  const key = url;
  const entry = cache.get(key);

  // Serve fresh cached data
  if (entry && entry.data !== undefined && entry.expiry > now()) {
    return entry.data as T;
  }

  // If there's already a request in-flight, wait for it
  if (entry && entry.promise) {
    return entry.promise as Promise<T>;
  }

  // Make a new request and cache it
  const p = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Request failed ${res.status}`);
      const data = await res.json();
      cache.set(key, { data, expiry: now() + ttlMs });
      return data as T;
    })
    .catch((err) => {
      // On failure, clear in-flight state but keep stale data if present
      const existing = cache.get(key);
      if (existing && existing.data !== undefined) {
        cache.set(key, { data: existing.data, expiry: existing.expiry });
      } else {
        cache.delete(key);
      }
      throw err;
    })
    .finally(() => {
      const latest = cache.get(key);
      if (latest) {
        delete latest.promise;
      }
    });

  cache.set(key, { ...(entry || {}), promise: p, expiry: (entry?.expiry ?? 0) });
  return p;
}

export function clearCached(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}
