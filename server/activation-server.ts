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

const monthCodesList = [
  "TN13",
  "CV13",
  "PASS13",
  "MOIS13",
  "MONTH13",
  "13TND",
  "ETUDIANT13",
  "STUDENT13",
  "STAGE13",
  "PFE13",
];

const yearCodesList = [
  "PRO30",
  "VIP30",
  "PASS30",
  "YEAR30",
  "AN30",
  "1AN",
  "ANNUEL",
  "TOUNSI30",
  "30TND",
  "PRO25",
  "VIP25",
  "PASS25",
  "TOUNSI25",
  "25TND",
  "UPGRADE17",
  "PASSUPGRADE",
  "UPGRADEPRO",
  "TOUNSI2026",
  "CVTOUNSI",
  "92067554",
  "ADMINPRO",
];

/* ── Validate activation code (Database first + Dynamic Algorithmic Fallback) ── */
export async function validateActivationCode(
  inputCode: string,
  fullName: string
): Promise<ActivationValidationResult> {
  if (!inputCode) return { valid: false };

  const cleanInput = normalizeCodeString(inputCode);
  if (cleanInput.length < 3) return { valid: false };

  // 1. Priority 1: Check in connected Database
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

      const isMonth = Number(dbCode.amount) <= 15;
      return {
        valid: true,
        plan: isMonth ? "month" : "year",
        amount: Number(dbCode.amount) || (isMonth ? 12.9 : 29.9),
      };
    }
  } catch (err) {
    console.warn("[Activation Server] DB check skipped, falling back to algorithmic validation:", err);
  }

  // 2. Priority 2: 1 Month standard codes (12.900 DT / 13 DT)
  if (monthCodesList.includes(cleanInput) || cleanInput.endsWith("13") || cleanInput.endsWith("MOIS")) {
    return {
      valid: true,
      plan: "month",
      amount: 12.9,
    };
  }

  // 3. Priority 3: 1 Year standard promo / admin codes (29.900 DT / 30 DT)
  if (yearCodesList.includes(cleanInput) || cleanInput.endsWith("30") || cleanInput.endsWith("25") || cleanInput.endsWith("AN") || cleanInput.endsWith("PRO")) {
    return {
      valid: true,
      plan: "year",
      amount: 29.9,
    };
  }

  // All other codes without a valid DB entry are strictly rejected
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
