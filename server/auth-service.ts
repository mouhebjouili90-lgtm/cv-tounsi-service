/**
 * CV Tounsi — Server-side User Authentication Service (Email/Password & Google Login)
 * 
 * Secure, zero-external-binary crypto implementation:
 * - PBKDF2 with SHA-512 & unique 16-byte salt for passwords.
 * - HMAC-SHA256 stateless signed JWT sessions.
 * - Google Identity Services token verification.
 */

import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import {
  findUserByEmailInDb,
  findUserByIdInDb,
  findUserByGoogleIdInDb,
  createUserInDb,
  updateUserLastLoginInDb,
} from "./db.js";
import type { User } from "../drizzle/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.ACTIVATION_SECRET || "cvtounsi_jwt_session_secret_2026";
const TOKEN_EXPIRY_DAYS = 30;

// ── Password Hashing & Verification ──

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

// ── User Session JWT ──

export interface UserSessionPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export function generateUserToken(user: User): string {
  const exp = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload: UserSessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    role: user.role || "user",
    exp,
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

export function verifyUserToken(token: string): UserSessionPayload | null {
  try {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
    const parts = cleanToken.split(".");
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(base64Payload)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload: UserSessionPayload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ── Express Authentication Middleware ──

export interface AuthenticatedRequest extends Request {
  user?: UserSessionPayload;
}

export function requireUserAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"] || req.headers["x-auth-token"];
  const token = authHeader?.toString();

  if (!token) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  const payload = verifyUserToken(token);
  if (!payload) {
    res.status(401).json({ error: "Session expirée ou invalide. Veuillez vous reconnecter." });
    return;
  }

  req.user = payload;
  next();
}

// ── Google Token Verification ──

export interface GooglePayload {
  sub: string; // Google User ID
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean | string;
}

export async function verifyGoogleToken(idToken: string): Promise<GooglePayload | null> {
  try {
    if (!idToken) return null;

    // Direct Google Token Info endpoint verification
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      console.warn("[Auth] Google token verification failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data.email || !data.sub) return null;

    return {
      sub: data.sub,
      email: data.email,
      name: data.name || data.email.split("@")[0],
      picture: data.picture,
      email_verified: data.email_verified === true || data.email_verified === "true",
    };
  } catch (error) {
    console.error("[Auth] Error verifying Google token:", error);
    return null;
  }
}

// ── High-Level Auth Handlers ──

export async function registerWithEmail(email: string, password: string, name?: string) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Adresse email invalide.");
  }
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  const existing = await findUserByEmailInDb(cleanEmail);
  if (existing) {
    throw new Error("Un compte existe déjà avec cette adresse email.");
  }

  const passwordHash = hashPassword(password);
  const user = await createUserInDb({
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split("@")[0],
    passwordHash,
    role: "user",
  });

  const token = generateUserToken(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    token,
  };
}

export async function loginWithEmail(email: string, password: string) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error("Veuillez fournir un email et un mot de passe.");
  }

  const user = await findUserByEmailInDb(cleanEmail);
  if (!user) {
    throw new Error("Aucun compte trouvé avec cet email.");
  }

  if (!user.passwordHash) {
    throw new Error("Ce compte a été créé avec Google. Veuillez vous connecter avec Google.");
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Mot de passe incorrect.");
  }

  await updateUserLastLoginInDb(user.id);
  const token = generateUserToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    token,
  };
}

export async function loginWithGoogle(idToken: string) {
  const googleData = await verifyGoogleToken(idToken);
  if (!googleData) {
    throw new Error("Token Google invalide ou expiré.");
  }

  // 1. Try finding by Google ID
  let user = await findUserByGoogleIdInDb(googleData.sub);

  // 2. If not found, try finding by email
  if (!user) {
    user = await findUserByEmailInDb(googleData.email);
  }

  // 3. If still not found, create new account
  if (!user) {
    user = await createUserInDb({
      email: googleData.email,
      name: googleData.name || googleData.email.split("@")[0],
      googleId: googleData.sub,
      avatarUrl: googleData.picture,
      role: "user",
    });
  } else {
    // Update last login
    await updateUserLastLoginInDb(user.id);
  }

  const token = generateUserToken(user);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || googleData.picture,
      role: user.role,
    },
    token,
  };
}
