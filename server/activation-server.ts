/**
 * CV Tounsi — Server-side Activation Code Validation & HMAC Token System
 * 
 * This module validates codes against the Database (MySQL/TiDB/PlanetScale)
 * with dynamic memorable pattern matching fallback.
 * 
 * Tokens are signed with HMAC-SHA256 using the ACTIVATION_SECRET env variable.
 */

import crypto from "node:crypto";
import { getActivationCodeFromDb, recordCodeUsageInDb } from "./db";

const ACTIVATION_SECRET = process.env.ACTIVATION_SECRET || "cvtounsi_default_fallback_secret";

/* ── Normalize code string (remove accents, uppercase, keep only A-Z0-9) ── */
export function normalizeCodeString(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/* ── Validate activation code (Database first + Dynamic Algorithmic Fallback) ── */
export async function validateActivationCode(inputCode: string, fullName: string): Promise<boolean> {
  if (!inputCode) return false;

  const cleanInput = normalizeCodeString(inputCode);
  if (cleanInput.length < 3) return false;

  // 1. Priority 1: Check in connected Database
  try {
    const dbCode = await getActivationCodeFromDb(cleanInput);
    if (dbCode) {
      // Check code status and expiration
      if (dbCode.status === "revoked" || dbCode.status === "expired") {
        return false;
      }
      if (dbCode.expiresAt && new Date(dbCode.expiresAt).getTime() < Date.now()) {
        return false;
      }
      if (dbCode.usageCount >= dbCode.maxUsage) {
        return false;
      }

      // Record successful usage in DB
      await recordCodeUsageInDb(cleanInput);
      return true;
    }
  } catch (err) {
    console.warn("[Activation Server] DB check skipped, falling back to algorithmic validation:", err);
  }

  // 2. Priority 2: Standard permanent codes
  const standardCodes = [
    "TN19", "CV19", "TOUNSI19", "TOUNSI2026",
    "CVTOUNSI", "CVTOUNSI19", "PASS19", "PRO19",
    "VIP19", "PAID19", "19TND", "95669209",
    "9566920919", "ADMINPRO",
  ];
  if (standardCodes.includes(cleanInput)) return true;

  // 3. Priority 3: Date-based dynamic codes
  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, "0");
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const yearStr = String(now.getFullYear());

  const dateCodes = [
    `TN${dayStr}`, `TN${dayStr}19`, `TN${monthStr}19`,
    `TN${yearStr}`, `CV${yearStr}`, `CV${monthStr}19`,
  ];
  if (dateCodes.includes(cleanInput)) return true;

  // 4. Priority 4: Name-based personalized codes
  if (fullName && fullName.trim().length > 0) {
    const rawWords = fullName.trim().split(/\s+/)
      .map((w) => normalizeCodeString(w))
      .filter((w) => w.length >= 2);

    for (const word of rawWords) {
      const candidateValidVariants = [
        `${word}19`, `${word}26`, `${word}${yearStr}`,
        `TN${word}`, `TN${word}19`, `CV${word}`,
        `CV${word}19`, `${word}`,
      ];
      if (candidateValidVariants.includes(cleanInput)) return true;
    }

    const fullCombined = rawWords.join("");
    if (
      cleanInput === `${fullCombined}19` ||
      cleanInput === `TN${fullCombined}` ||
      cleanInput === `TN${fullCombined}19` ||
      cleanInput === `${fullCombined}${yearStr}`
    ) return true;
  }

  // 5. Priority 5: Structured code with official prefix/suffix
  if (
    cleanInput.startsWith("TN") || cleanInput.startsWith("CV") ||
    cleanInput.startsWith("PRO") || cleanInput.startsWith("VIP") ||
    cleanInput.endsWith("19")
  ) {
    if (cleanInput.length >= 4) return true;
  }

  return false;
}

/* ── Generate HMAC-SHA256 signed activation token ── */
export function generateActivationToken(fullName: string): string {
  const payload = JSON.stringify({
    name: fullName,
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
export function verifyActivationToken(token: string): { valid: boolean; name?: string } {
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

    // Token valid for 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > thirtyDaysMs) return { valid: false };

    return { valid: true, name: payload.name };
  } catch {
    return { valid: false };
  }
}
