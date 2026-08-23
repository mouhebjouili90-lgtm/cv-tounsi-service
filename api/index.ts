import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import {
  validateActivationCode,
  generateActivationToken,
  verifyActivationToken,
} from "../server/activation-server";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

// Rate Limiter — In-memory per-IP tracking for AI endpoint
// Rapport SaaS Tâche 1.5 : Maximum 5 améliorations par IP par heure (Gratuit) / 50 par heure (Payant)
const RATE_LIMIT_FREE_MAX = 5;
const RATE_LIMIT_PREMIUM_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 heure
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

// ── Health Check Endpoint ──
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CV Tounsi SaaS (Serverless)",
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
      console.error("[Vercel Serverless] Gemini status:", geminiRes.status, err);
      res.status(geminiRes.status).json({ error: err });
      return;
    }

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ text });
  } catch (error: any) {
    console.error("[Vercel Serverless] AI Error:", error?.message);
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

// ── Admin Authentication Middleware ──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cvtounsi_admin_2026";

const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"] || req.headers["x-admin-key"];
  if (authHeader === `Bearer ${ADMIN_PASSWORD}` || authHeader === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: "Mot de passe administrateur incorrect" });
};

// ── Admin Login ──
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: "Mot de passe incorrect" });
  }
});

// ── SaaS Analytics & Admin Stats Endpoint ──
app.get("/api/admin/stats", checkAdminAuth, async (_req: Request, res: Response) => {
  try {
    const { getSaaSStatsFromDb } = await import("../server/db");
    const stats = await getSaaSStatsFromDb();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch stats" });
  }
});

// ── Admin: List all codes ──
app.get("/api/admin/codes", checkAdminAuth, async (_req: Request, res: Response) => {
  try {
    const { getAllActivationCodesFromDb } = await import("../server/db");
    const codes = await getAllActivationCodesFromDb();
    res.json({ codes });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch codes" });
  }
});

// ── Admin: Create a new activation code ──
app.post("/api/admin/codes/create", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { createActivationCodeInDb } = await import("../server/db");
    const success = await createActivationCodeInDb(req.body);
    if (success) {
      res.json({ success: true, message: "Code créé avec succès" });
    } else {
      res.status(400).json({ success: false, error: "Impossible de créer le code (peut-être déjà existant)" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// ── Admin: Toggle code status (active / revoked) ──
app.post("/api/admin/codes/toggle-status", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { updateCodeStatusInDb } = await import("../server/db");
    const { code, status } = req.body;
    const success = await updateCodeStatusInDb(code, status);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// ── Admin: Delete a code ──
app.delete("/api/admin/codes/delete", checkAdminAuth, async (req: Request, res: Response) => {
  try {
    const { deleteActivationCodeFromDb } = await import("../server/db");
    const { code } = req.body;
    const success = await deleteActivationCodeFromDb(code);
    res.json({ success });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// ── Admin: Recent CV generations ──
app.get("/api/admin/cvs", checkAdminAuth, async (_req: Request, res: Response) => {
  try {
    const { getRecentCvGenerationsFromDb } = await import("../server/db");
    const cvs = await getRecentCvGenerationsFromDb(30);
    res.json({ cvs });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch CVs" });
  }
});

export default app;
