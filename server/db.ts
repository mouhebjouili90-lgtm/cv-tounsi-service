import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  activationCodes,
  cvGenerations,
  type ActivationCode,
  type InsertActivationCode,
  type InsertCvGeneration,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * ── Connexion à la Base de Données (MySQL / TiDB / PlanetScale / Aiven) ──
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const poolConnection = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(poolConnection);
      console.log("[Database] Connected successfully to MySQL/TiDB database");
    } catch (error) {
      console.warn("[Database] Connection failed, operating in resilient fallback mode:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * ── 1. Vérification d'un Code d'Activation en BDD ──
 */
export async function getActivationCodeFromDb(code: string): Promise<ActivationCode | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const cleanCode = (code || "").trim().toUpperCase();
    const results = await db
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.code, cleanCode))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("[Database] Error querying activation code:", error);
    return null;
  }
}

/**
 * ── 2. Incrémentation de l'Utilisation d'un Code ──
 */
export async function recordCodeUsageInDb(code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const cleanCode = (code || "").trim().toUpperCase();
    await db
      .update(activationCodes)
      .set({
        usageCount: sql`${activationCodes.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(activationCodes.code, cleanCode));
    return true;
  } catch (error) {
    console.error("[Database] Error updating code usage:", error);
    return false;
  }
}

/**
 * ── 3. Création / Enregistrement d'un Nouveau Code d'Activation ──
 */
export async function createActivationCodeInDb(data: InsertActivationCode): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(activationCodes).values({
      ...data,
      code: data.code.trim().toUpperCase(),
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("[Database] Error creating activation code:", error);
    return false;
  }
}

/**
 * ── 4. Enregistrement des Statistiques de Création de CV ──
 */
export async function recordCvGenerationInDb(data: InsertCvGeneration): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(cvGenerations).values({
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Database] Error saving CV analytics:", error);
  }
}

/**
 * ── 5. Statistiques Globales du SaaS (pour Dashboard Admin) ──
 */
export async function getSaaSStatsFromDb() {
  const db = await getDb();
  if (!db) {
    return {
      totalCodes: 0,
      totalRevenueTND: 0,
      totalCvCreated: 0,
      isDatabaseConnected: false,
    };
  }

  try {
    const [codesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activationCodes);

    const [revenue] = await db
      .select({ sum: sql<number>`sum(${activationCodes.amount})` })
      .from(activationCodes)
      .where(eq(activationCodes.status, "used"));

    const [cvsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cvGenerations);

    return {
      totalCodes: Number(codesCount?.count || 0),
      totalRevenueTND: Number(revenue?.sum || 0),
      totalCvCreated: Number(cvsCount?.count || 0),
      isDatabaseConnected: true,
    };
  } catch (error) {
    console.error("[Database] Error calculating SaaS stats:", error);
    return {
      totalCodes: 0,
      totalRevenueTND: 0,
      totalCvCreated: 0,
      isDatabaseConnected: false,
    };
  }
}
