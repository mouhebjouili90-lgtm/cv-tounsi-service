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
      const validation = await validateActivationCode(code || "", fullName || "");

      if (validation.valid) {
        const plan = validation.plan || "pro";
        const token = generateActivationToken(fullName || "Client", plan);

        const { verifyUserToken } = await import("./auth-service.js");
        const { updateUserPlanInDb } = await import("./db.js");
        const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
        const userSession = authHeader ? verifyUserToken(authHeader.toString()) : null;

        if (userSession?.userId) {
          await updateUserPlanInDb(userSession.userId, plan);
        }

        res.json({
          valid: true,
          plan,
          amount: validation.amount,
          token,
          userId: userSession?.userId || null,
          userEmail: userSession?.email || null,
        });
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

  // ── Server-side PDF Generator & Paywall Verification ──
  app.post("/api/pdf/generate", async (req: Request, res: Response) => {
    try {
      const { html, token, isDemo } = req.body;
      const { canGenerateCleanPdf, buildPrintHtml } = await import("./pdf-generator");

      const isUnlocked = canGenerateCleanPdf(token);

      if (!isDemo && !isUnlocked) {
        res.status(403).json({
          error: "Code d'activation requis pour exporter le PDF officiel Haute Définition.",
          isUnlocked: false,
        });
        return;
      }

      const printHtml = buildPrintHtml(html || "", isUnlocked);
      res.json({
        success: true,
        isUnlocked,
        printHtml,
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur de génération PDF" });
    }
  });

  // ── User Authentication (Email/Password & Google) ──
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { registerWithEmail } = await import("./auth-service.js");
      const { email, password, name } = req.body;
      const result = await registerWithEmail(email, password, name);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Erreur d'inscription" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { loginWithEmail } = await import("./auth-service.js");
      const { email, password } = req.body;
      const result = await loginWithEmail(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Erreur de connexion" });
    }
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { loginWithGoogle } = await import("./auth-service.js");
      const { credential, idToken } = req.body;
      const tokenToVerify = credential || idToken;

      if (!tokenToVerify) {
        res.status(400).json({ error: "Token Google manquant" });
        return;
      }

      const result = await loginWithGoogle(tokenToVerify);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Erreur lors de la connexion Google" });
    }
  });

  app.post("/api/auth/google/demo", async (req: Request, res: Response) => {
    try {
      const { findUserByIdInDb, createUserInDb } = await import("./db.js");
      const { generateUserToken } = await import("./auth-service.js");
      const { email, name, avatarUrl } = req.body;
      const cleanEmail = (email || "demo.user@gmail.com").trim().toLowerCase();
      
      let user = await findUserByIdInDb(1);
      if (!user) {
        user = await createUserInDb({
          email: cleanEmail,
          name: name || "Utilisateur Google Demo",
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          googleId: "demo-google-id-123456",
          role: "user",
        });
      }

      const token = generateUserToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur demo login" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const { verifyUserToken } = await import("./auth-service.js");
      const { findUserByIdInDb } = await import("./db.js");
      const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
      const payload = verifyUserToken(authHeader?.toString() || "");

      if (!payload) {
        res.status(401).json({ error: "Non authentifié" });
        return;
      }

      const user = await findUserByIdInDb(payload.userId);
      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur session" });
    }
  });

  // ── User Saved CVs Endpoints ──

  app.get("/api/user/cvs", async (req: Request, res: Response) => {
    try {
      const { verifyUserToken } = await import("./auth-service.js");
      const { getUserCvsFromDb } = await import("./db.js");
      const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
      const payload = verifyUserToken(authHeader?.toString() || "");

      if (!payload) {
        res.status(401).json({ error: "Authentification requise" });
        return;
      }

      const cvList = await getUserCvsFromDb(payload.userId);
      res.json({ cvs: cvList });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur lors du chargement des CVs" });
    }
  });

  app.post("/api/user/cvs/save", async (req: Request, res: Response) => {
    try {
      const { verifyUserToken } = await import("./auth-service.js");
      const { saveUserCvInDb, getUserCvsFromDb } = await import("./db.js");
      const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
      const payload = verifyUserToken(authHeader?.toString() || "");

      if (!payload) {
        res.status(401).json({ error: "Authentification requise" });
        return;
      }

      const { id, title, dataJson, template, language, isUnlocked } = req.body;
      if (!dataJson) {
        res.status(400).json({ error: "Données du CV manquantes" });
        return;
      }

      // Determine unlock status based on tier rules:
      // Pro & Admin: All CVs are automatically unlocked in HD
      // Student: 1 single CV unlocked; subsequent new CVs are locked in demo mode
      let effectiveUnlocked = !!isUnlocked;
      if (payload.role === "pro" || payload.role === "admin") {
        effectiveUnlocked = true;
      } else if (payload.role === "student") {
        const existingCvs = await getUserCvsFromDb(payload.userId);
        if (existingCvs.length === 0) {
          effectiveUnlocked = true;
        } else {
          const firstCvId = existingCvs[0].id;
          if (id && Number(id) === firstCvId) {
            effectiveUnlocked = true;
          } else {
            effectiveUnlocked = false;
          }
        }
      }

      const saved = await saveUserCvInDb({
        id: id ? Number(id) : undefined,
        userId: payload.userId,
        title: title || "Mon CV Tounsi",
        dataJson: typeof dataJson === "string" ? dataJson : JSON.stringify(dataJson),
        template: template || "professional",
        language: language || "fr",
        isUnlocked: effectiveUnlocked,
      });

      res.json({ success: true, cv: saved, effectiveUnlocked });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur sauvegarde CV" });
    }
  });

  app.delete("/api/user/cvs/:id", async (req: Request, res: Response) => {
    try {
      const { verifyUserToken } = await import("./auth-service.js");
      const { deleteUserCvFromDb } = await import("./db.js");
      const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
      const payload = verifyUserToken(authHeader?.toString() || "");

      if (!payload) {
        res.status(401).json({ error: "Authentification requise" });
        return;
      }

      const cvId = Number(req.params.id);
      const success = await deleteUserCvFromDb(payload.userId, cvId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Erreur suppression CV" });
    }
  });

  // ── Admin Authentication Middleware ──
  const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "cvtounsi_admin_2026").trim();

  const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"] || req.headers["x-admin-key"];
    const token = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
    if (token === ADMIN_PASSWORD) {
      return next();
    }
    return res.status(401).json({ error: "Mot de passe administrateur incorrect" });
  };

  // ── Admin Login ──
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const password = (req.body?.password || "").trim();
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: ADMIN_PASSWORD });
    } else {
      res.status(401).json({ success: false, error: "Mot de passe incorrect" });
    }
  });

  // ── SaaS Analytics & Admin Stats Endpoint ──
  app.get("/api/admin/stats", checkAdminAuth, async (_req: Request, res: Response) => {
    try {
      const { getSaaSStatsFromDb } = await import("./db");
      const stats = await getSaaSStatsFromDb();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to fetch stats" });
    }
  });

  // ── Admin: List all codes ──
  app.get("/api/admin/codes", checkAdminAuth, async (_req: Request, res: Response) => {
    try {
      const { getAllActivationCodesFromDb } = await import("./db");
      const codes = await getAllActivationCodesFromDb();
      res.json({ codes });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to fetch codes" });
    }
  });

  // ── Admin: Create a new activation code ──
  app.post("/api/admin/codes/create", checkAdminAuth, async (req: Request, res: Response) => {
    try {
      const { createActivationCodeInDb } = await import("./db");
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
      const { updateCodeStatusInDb } = await import("./db");
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
      const { deleteActivationCodeFromDb } = await import("./db");
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
      const { getRecentCvGenerationsFromDb } = await import("./db");
      const cvs = await getRecentCvGenerationsFromDb(30);
      res.json({ cvs });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to fetch CVs" });
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
