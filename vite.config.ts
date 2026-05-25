import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

/**
 * Walk up from `start` to find the directory that owns `.env.local`
 * (or `.env`). Lets git worktrees under `.claude/worktrees/*` reuse the
 * main repo's env files without per-worktree symlinks. Falls back to
 * `start` if nothing is found — Vite then surfaces the usual missing-env
 * error.
 */
function findEnvDir(start: string): string {
  let dir = start;
  while (true) {
    if (
      fs.existsSync(path.join(dir, ".env.local")) ||
      fs.existsSync(path.join(dir, ".env"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const envDir = findEnvDir(__dirname);

/**
 * Dev-only shim that serves the Vercel Edge function at `api/voice.ts`
 * as a Vite middleware. Without this, `npm run dev` (plain Vite) has no
 * `/api/voice` route — so the runtime name-MP3 fetch 404s and the kid
 * hears the static "Beautiful name…" half but never their actual name.
 * Production (Vercel) serves `api/voice.ts` natively, so this plugin is
 * dev-only (`apply: "serve"`).
 *
 * Env vars (`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`) are hydrated from
 * `.env.local` into `process.env` before the handler runs. Vite's
 * `loadEnv` only exposes `VITE_*` keys to client code; non-prefixed
 * server-side secrets stay server-side, which is what we want here.
 */
function devVoiceApi(): Plugin {
  return {
    name: "supertutors:dev-voice-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const env = loadEnv("development", envDir, "");
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      server.middlewares.use("/api/voice", async (req, res) => {
        try {
          // Buffer the request body — the Edge handler expects JSON.
          let body = "";
          req.setEncoding("utf8");
          for await (const chunk of req) body += chunk;

          // Reconstruct the Web Request the handler signature wants.
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(","));
          }
          const request = new Request(
            `http://${req.headers.host ?? "localhost"}/api/voice`,
            {
              method: req.method ?? "GET",
              headers,
              body: req.method === "POST" ? body : undefined,
            },
          );

          // Load via Vite's SSR loader so edits to api/voice.ts (or the
          // validation lib it imports) pick up without a full restart.
          const mod = await server.ssrLoadModule(
            path.resolve(__dirname, "api/voice.ts"),
          );
          const handler = mod.default as (r: Request) => Promise<Response>;
          const response = await handler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          if (response.body) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
          }
          res.end();
        } catch (err) {
          console.error("[dev-voice-api] /api/voice failed:", err);
          res.statusCode = 500;
          res.end(`Internal error: ${(err as Error).message}`);
        }
      });
    },
  };
}

export default defineConfig({
  envDir,
  plugins: [react(), devVoiceApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
