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
// Rapport SaaS Tâche 1.5 : Maximum 5 améliorations par IP par heure (Gratuit) / 50 par heure (Payant)
const RATE_LIMIT_FREE_MAX = 5;
const RATE_LIMIT_PREMIUM_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure (3600s)
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
  const token = req.headers["x-activation-token"]?.toString() || req.body?.token;

  // Check if user is a paid customer with valid HMAC token
  const isPremium = token ? verifyActivationToken(token).valid : false;
  const maxAllowed = isPremium ? RATE_LIMIT_PREMIUM_MAX : RATE_LIMIT_FREE_MAX;

  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
  } else {
    entry.count++;
  }

  const remaining = Math.max(0, maxAllowed - entry.count);
  res.setHeader("X-RateLimit-Limit", maxAllowed);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

  if (entry.count > maxAllowed) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / (60 * 1000));
    res.status(429).json({
      error: `Limite de 5 améliorations IA par heure atteinte. Veuillez patienter ${minutesLeft} minute(s) ou débloquez votre CV avec votre code d'activation.`,
      retryAfterMs: entry.resetAt - now,
      limit: maxAllowed,
      isPremium,
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
  app.post("/api/validate-code", async (req: Request, res: Response) => {
    try {
      const { code, fullName } = req.body;
      const isValid = await validateActivationCode(code || "", fullName || "");

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

  // ── SaaS Analytics & Admin Stats Endpoint ──
  app.get("/api/admin/stats", async (_req: Request, res: Response) => {
    try {
      const { getSaaSStatsFromDb } = await import("./db");
      const stats = await getSaaSStatsFromDb();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to fetch stats" });
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
