import { describe, expect, it, vi } from "vitest";
import {
  InMemoryNameAudioCache,
  getNameAudioUrl,
  normalizeNameKey,
} from "./nameAudioCache";

const fakeBlob = (text: string) =>
  new Blob([text], { type: "audio/mpeg" });

describe("normalizeNameKey", () => {
  it("lowercases and trims so spelling variants share an MP3", () => {
    expect(normalizeNameKey("Jason")).toBe("jason");
    expect(normalizeNameKey("  JASON  ")).toBe("jason");
    expect(normalizeNameKey("jason")).toBe("jason");
  });

  it("prefixes with voiceId so different tutors don't collide", () => {
    expect(normalizeNameKey("Jason", "voice123")).toBe("voice123:jason");
    expect(normalizeNameKey("  JASON  ", "voice123")).toBe("voice123:jason");
  });

  it("omits prefix when voiceId is undefined", () => {
    expect(normalizeNameKey("Jason", undefined)).toBe("jason");
  });
});

describe("InMemoryNameAudioCache", () => {
  it("returns null for an unset name", async () => {
    const cache = new InMemoryNameAudioCache();
    expect(await cache.get("jason")).toBeNull();
  });

  it("round-trips a blob by normalized key", async () => {
    const cache = new InMemoryNameAudioCache();
    const blob = fakeBlob("audio");
    await cache.set("Jason", blob);
    expect(await cache.get("  jason  ")).toBe(blob);
  });
});

describe("getNameAudioUrl", () => {
  it("returns the cached blob URL on hit without calling the proxy", async () => {
    const cache = new InMemoryNameAudioCache();
    const blob = fakeBlob("cached");
    await cache.set("jason", blob);

    const fetcher = vi.fn();
    const url = await getNameAudioUrl("Jason", {
      cache,
      fetcher: fetcher as unknown as typeof fetch,
      toObjectUrl: (b) => `blob:${(b as Blob).size}`,
    });

    expect(url).toBe(`blob:${blob.size}`);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches from /api/voice on cache miss, stores, returns URL", async () => {
    const cache = new InMemoryNameAudioCache();
    const fetched = fakeBlob("from-proxy");
    const fetcher = vi.fn(async () =>
      new Response(fetched, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      }),
    );

    const url = await getNameAudioUrl("Jason", {
      cache,
      fetcher: fetcher as unknown as typeof fetch,
      toObjectUrl: () => "blob:fresh",
    });

    expect(url).toBe("blob:fresh");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(
      "/api/voice",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Jason" }),
      }),
    );
    const stored = await cache.get("jason");
    expect(stored).not.toBeNull();
  });

  it("throws on non-2xx so the caller can fall back to text", async () => {
    const cache = new InMemoryNameAudioCache();
    const fetcher = vi.fn(async () =>
      new Response("nope", { status: 503 }),
    );

    await expect(
      getNameAudioUrl("Jason", {
        cache,
        fetcher: fetcher as unknown as typeof fetch,
        toObjectUrl: () => "blob:x",
      }),
    ).rejects.toThrow(/503/);
  });

  it("a second call after a miss hits the cache (no second fetch)", async () => {
    const cache = new InMemoryNameAudioCache();
    const fetched = fakeBlob("once");
    const fetcher = vi.fn(async () => new Response(fetched, { status: 200 }));

    const deps = {
      cache,
      fetcher: fetcher as unknown as typeof fetch,
      toObjectUrl: () => "blob:once",
    };

    await getNameAudioUrl("Jason", deps);
    await getNameAudioUrl("Jason", deps);

    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("sends voiceId in the request body when provided", async () => {
    const cache = new InMemoryNameAudioCache();
    const fetched = fakeBlob("with-voice");
    const fetcher = vi.fn(async () =>
      new Response(fetched, { status: 200, headers: { "Content-Type": "audio/mpeg" } }),
    );

    await getNameAudioUrl("Jason", {
      cache,
      fetcher: fetcher as unknown as typeof fetch,
      toObjectUrl: () => "blob:v",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "/api/voice",
      expect.objectContaining({
        body: JSON.stringify({ name: "Jason", voiceId: "EXAVITQu4vr4xnSDxMaL" }),
      }),
    );
  });

  it("different voiceIds cache separately for the same name", async () => {
    const cache = new InMemoryNameAudioCache();
    const blob1 = fakeBlob("tutor-a");
    const blob2 = fakeBlob("tutor-b");
    let callCount = 0;
    const fetcher = vi.fn(async () => {
      callCount++;
      return new Response(callCount === 1 ? blob1 : blob2, { status: 200 });
    });

    await getNameAudioUrl("Jason", { cache, fetcher: fetcher as unknown as typeof fetch, toObjectUrl: () => "blob:a", voiceId: "voice1111" });
    await getNameAudioUrl("Jason", { cache, fetcher: fetcher as unknown as typeof fetch, toObjectUrl: () => "blob:b", voiceId: "voice2222" });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
