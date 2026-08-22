import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  validateActivationCode,
  generateActivationToken,
  verifyActivationToken,
} from "./activation-server";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate Limiter — In-memory per-IP tracking for AI endpoint
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({
      error: "Trop de requêtes IA. Veuillez patienter 15 minutes avant de réessayer.",
      retryAfterMs: RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  next();
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "2mb" }));

  // ── Health Check Endpoint ──
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "CV Tounsi SaaS",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── AI Generator Proxy ──
  app.post("/api/ai/generate", checkRateLimit, async (req: Request, res: Response) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

      if (!apiKey) {
        res.status(500).json({ error: "AI service not configured on server" });
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
        console.error("[Production Server] Gemini status:", geminiRes.status, err);
        res.status(geminiRes.status).json({ error: err });
        return;
      }

      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      res.json({ text });
    } catch (error: any) {
      console.error("[Production Server] AI Error:", error?.message);
      res.status(500).json({ error: error?.message || "Internal error" });
    }
  });

  // ── Activation Code Validation ──
  app.post("/api/validate-code", (req: Request, res: Response) => {
    try {
      const { code, fullName } = req.body;
      const isValid = validateActivationCode(code || "", fullName || "");

      if (isValid) {
        const token = generateActivationToken(fullName || "Client");
        res.json({ valid: true, token });
      } else {
        res.json({ valid: false });
      }
    } catch {
      res.status(400).json({ valid: false, error: "Invalid request" });
    }
  });

  // ── Activation Token Verification ──
  app.post("/api/verify-token", (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const result = verifyActivationToken(token || "");
      res.json(result);
    } catch {
      res.json({ valid: false });
    }
  });

  // ── Serve Static Assets ──
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // ── SPA Fallback Routing ──
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`[CV Tounsi SaaS] Production server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
