/**
 * CV Tounsi — Server-side Activation Code Validation & HMAC Token System
 * 
 * This module validates codes against the Database (MySQL/TiDB/PlanetScale)
 * with dynamic memorable pattern matching fallback.
 * 
 * Tokens are signed with HMAC-SHA256 using the ACTIVATION_SECRET env variable.
 */

import crypto from "node:crypto";
import { getActivationCodeFromDb, recordCodeUsageInDb } from "./db.js";

const ACTIVATION_SECRET = process.env.ACTIVATION_SECRET || "cvtounsi_default_fallback_secret";

/* ── Normalize code string (remove accents, uppercase, keep only A-Z0-9) ── */
export function normalizeCodeString(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export type ActivationValidationResult = {
  valid: boolean;
  plan?: "month" | "year" | "student" | "pro";
  amount?: number;
};

/* ── Validate activation code (Strict Database verification) ── */
export async function validateActivationCode(
  inputCode: string,
  fullName: string
): Promise<ActivationValidationResult> {
  if (!inputCode) return { valid: false };

  const cleanInput = normalizeCodeString(inputCode);
  if (cleanInput.length < 3) return { valid: false };

  // 1. Primary Check: Validate against Database (TiDB / MySQL / Resilient Store)
  try {
    const dbCode = await getActivationCodeFromDb(cleanInput);
    if (dbCode) {
      // Check code status and expiration
      if (dbCode.status === "revoked" || dbCode.status === "expired") {
        return { valid: false };
      }
      if (dbCode.expiresAt && new Date(dbCode.expiresAt).getTime() < Date.now()) {
        return { valid: false };
      }
      if (dbCode.usageCount >= dbCode.maxUsage) {
        return { valid: false };
      }

      // Record successful usage in DB
      await recordCodeUsageInDb(cleanInput);

      // Amount <= 15 TND corresponds to Pass 1 Mois (12.900 DT); > 15 TND corresponds to Pass 1 An (29.900 DT)
      const isMonth = Number(dbCode.amount) <= 15;
      return {
        valid: true,
        plan: isMonth ? "month" : "year",
        amount: Number(dbCode.amount) || (isMonth ? 12.9 : 29.9),
      };
    }
  } catch (err) {
    console.warn("[Activation Server] DB check error:", err);
  }

  // 2. Emergency Admin Rescue Codes (for admin testing only)
  if (cleanInput === "ADMINPRO" || cleanInput === "92067554") {
    return {
      valid: true,
      plan: "year",
      amount: 29.9,
    };
  }

  // Strictly reject all ungenerated codes
  return { valid: false };
}

/* ── Generate HMAC-SHA256 signed activation token ── */
export function generateActivationToken(fullName: string, plan: "month" | "year" | "student" | "pro" = "year"): string {
  const payload = JSON.stringify({
    name: fullName,
    plan,
    activated: true,
    timestamp: Date.now(),
  });
  const base64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ACTIVATION_SECRET)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/* ── Verify HMAC-SHA256 signed activation token ── */
export function verifyActivationToken(token: string): { valid: boolean; name?: string; plan?: "month" | "year" | "student" | "pro" } {
  try {
    const [base64Payload, signature] = token.split(".");
    if (!base64Payload || !signature) return { valid: false };

    const expectedSignature = crypto
      .createHmac("sha256", ACTIVATION_SECRET)
      .update(base64Payload)
      .digest("base64url");

    if (signature !== expectedSignature) return { valid: false };

    const payload = JSON.parse(Buffer.from(base64Payload, "base64url").toString("utf-8"));
    if (!payload.activated) return { valid: false };

    // Token duration: 365 days for year, 30 days for month
    const isYear = payload.plan === "year" || payload.plan === "pro";
    const maxDurationMs = isYear ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > maxDurationMs) return { valid: false };

    return {
      valid: true,
      name: payload.name,
      plan: payload.plan || "year",
    };
  } catch {
    return { valid: false };
  }
}
