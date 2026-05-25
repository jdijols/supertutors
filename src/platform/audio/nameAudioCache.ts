/**
 * Name Audio Cache — IndexedDB-backed cache of ElevenLabs-generated MP3 blobs
 * keyed by the kid's name. Falls back to fetching from /api/voice on miss.
 *
 * See PRD §3.11 Audio Architecture — runtime pipeline.
 *
 * Design:
 *   - `NameAudioCache` is an interface so tests can drop in an in-memory impl.
 *   - `IndexedDbNameAudioCache` is the production implementation.
 *   - `getNameAudioUrl(name, deps)` is the cache-or-fetch entry point used by
 *     the AudioEngine when a {{NAME}}-bearing line is played.
 *
 * Cache key normalization: names are lower-cased + trimmed so "Jason" and
 * "  jason  " share a single MP3.
 */

const DB_NAME = "supertutors_voice";
const DB_VERSION = 1;
const STORE = "names";

export function normalizeNameKey(name: string, voiceId?: string): string {
  const base = name.trim().toLowerCase();
  return voiceId ? `${voiceId}:${base}` : base;
}

export interface NameAudioCache {
  get(name: string, voiceId?: string): Promise<Blob | null>;
  set(name: string, blob: Blob, voiceId?: string): Promise<void>;
}

export class InMemoryNameAudioCache implements NameAudioCache {
  private readonly store = new Map<string, Blob>();

  async get(name: string, voiceId?: string): Promise<Blob | null> {
    return this.store.get(normalizeNameKey(name, voiceId)) ?? null;
  }

  async set(name: string, blob: Blob, voiceId?: string): Promise<void> {
    this.store.set(normalizeNameKey(name, voiceId), blob);
  }
}

export class IndexedDbNameAudioCache implements NameAudioCache {
  private readonly idb: IDBFactory;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(idb: IDBFactory = globalThis.indexedDB) {
    this.idb = idb;
  }

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = this.idb.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  async get(name: string, voiceId?: string): Promise<Blob | null> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(normalizeNameKey(name, voiceId));
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async set(name: string, blob: Blob, voiceId?: string): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).put(blob, normalizeNameKey(name, voiceId));
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export interface NameAudioFetchDeps {
  cache?: NameAudioCache;
  fetcher?: typeof fetch;
  /** Object URL factory — injectable for tests where URL.createObjectURL is absent. */
  toObjectUrl?: (blob: Blob) => string;
  /** ElevenLabs voice ID for this lesson — namespaces the cache key and sent in the proxy request. */
  voiceId?: string;
}

/**
 * Resolves a playable URL for the kid's name MP3.
 *   1. Look up by normalized name in the cache.
 *   2. Cache miss → POST /api/voice with the name; the proxy returns audio/mpeg.
 *   3. Store the blob, return an object URL.
 *
 * Throws on transport error or non-2xx response so the caller can decide
 * whether to fall back to text-only playback.
 */
export async function getNameAudioUrl(
  name: string,
  deps: NameAudioFetchDeps = {},
): Promise<string> {
  const cache = deps.cache ?? new IndexedDbNameAudioCache();
  const fetcher = deps.fetcher ?? fetch;
  const toObjectUrl = deps.toObjectUrl ?? ((b: Blob) => URL.createObjectURL(b));
  const { voiceId } = deps;

  const cached = await cache.get(name, voiceId);
  if (cached) return toObjectUrl(cached);

  const body: Record<string, string> = { name };
  if (voiceId) body.voiceId = voiceId;

  const res = await fetcher("/api/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`voice proxy returned ${res.status}`);
  }
  const blob = await res.blob();
  await cache.set(name, blob, voiceId);
  return toObjectUrl(blob);
}
