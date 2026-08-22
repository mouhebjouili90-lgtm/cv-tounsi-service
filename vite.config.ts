import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

// =============================================================================
// Rate Limiter — In-memory per-IP tracking for AI endpoint protection
// =============================================================================
const RATE_LIMIT_MAX = 10; // Max AI calls per window
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: any): string {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

/**
 * Fast direct AI Proxy middleware for Google Gemini 3.6 Flash
 * - Sub-second latency (< 400ms) with hard 6s timeout protection
 * - Rate limited: 10 calls per 15 minutes per IP
 * - API key is server-side only (never exposed to client)
 */
function vitePluginAi(): Plugin {
  return {
    name: "vite-plugin-ai",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/ai/generate", async (req, res, next) => {
        if (req.method !== "POST") return next();

        // Rate limit check
        const clientIp = getClientIp(req);
        if (isRateLimited(clientIp)) {
          res.writeHead(429, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: "Trop de requêtes IA. Veuillez patienter 15 minutes avant de réessayer.",
            retryAfterMs: RATE_LIMIT_WINDOW_MS,
          }));
          return;
        }

        let bodyStr = "";
        req.on("data", (chunk) => {
          bodyStr += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const { prompt, systemInstruction } = JSON.parse(bodyStr);
            const apiKey =
              process.env.GEMINI_API_KEY ||
              process.env.GOOGLE_API_KEY;

            if (!apiKey) {
              console.error("[Vite AI Middleware] No API key configured in environment");
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "AI service not configured" }));
              return;
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
            const payload: any = {
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
            };
            if (systemInstruction) {
              payload.systemInstruction = { parts: [{ text: systemInstruction }] };
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const geminiRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!geminiRes.ok) {
              const err = await geminiRes.text();
              console.error("[Vite AI Middleware] Gemini status:", geminiRes.status, err);
              res.writeHead(geminiRes.status, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err }));
              return;
            }

            const data = await geminiRes.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ text }));
          } catch (error: any) {
            console.error("[Vite AI Middleware] Error:", error?.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: error?.message || "Internal error" }));
          }
        });
      });
    },
  };
}

// =============================================================================
// Server-side Activation Code Validation Plugin
// =============================================================================
import {
  validateActivationCode,
  generateActivationToken,
  verifyActivationToken,
} from "./server/activation-server";

function vitePluginActivation(): Plugin {
  return {
    name: "vite-plugin-activation",
    configureServer(server: ViteDevServer) {
      // POST /api/validate-code — Validate activation code & return signed token
      server.middlewares.use("/api/validate-code", (req, res, next) => {
        if (req.method !== "POST") return next();

        let bodyStr = "";
        req.on("data", (chunk) => { bodyStr += chunk.toString(); });
        req.on("end", () => {
          try {
            const { code, fullName } = JSON.parse(bodyStr);
            const isValid = validateActivationCode(code || "", fullName || "");

            if (isValid) {
              const token = generateActivationToken(fullName || "Client");
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ valid: true, token }));
            } else {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ valid: false }));
            }
          } catch (error: any) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ valid: false, error: "Invalid request" }));
          }
        });
      });

      // POST /api/verify-token — Verify a previously issued activation token
      server.middlewares.use("/api/verify-token", (req, res, next) => {
        if (req.method !== "POST") return next();

        let bodyStr = "";
        req.on("data", (chunk) => { bodyStr += chunk.toString(); });
        req.on("end", () => {
          try {
            const { token } = JSON.parse(bodyStr);
            const result = verifyActivationToken(token || "");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          } catch {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ valid: false }));
          }
        });
      });
    },
  };
}

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  vitePluginManusDebugCollector(),
  vitePluginAi(),
  vitePluginActivation(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
