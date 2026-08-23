import "dotenv/config";
import { eq, desc, sql } from "drizzle-orm";
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
let _pool: mysql.Pool | null = null;

// ── In-Memory Resilient Store (Always ready even if DB is offline or cold-starting) ──
const initialMasterCodes: ActivationCode[] = [
  {
    id: 1,
    code: "TN19",
    customerName: "Code Universel Tunisie",
    customerPhone: "+216 95 669 209",
    status: "active",
    amount: 19,
    paymentMethod: "standard",
    usageCount: 0,
    maxUsage: 9999,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
  {
    id: 2,
    code: "PRO19",
    customerName: "Code Master Pro",
    customerPhone: null,
    status: "active",
    amount: 19,
    paymentMethod: "standard",
    usageCount: 0,
    maxUsage: 9999,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
  {
    id: 3,
    code: "VIP19",
    customerName: "Code Partenaire VIP",
    customerPhone: null,
    status: "active",
    amount: 19,
    paymentMethod: "standard",
    usageCount: 0,
    maxUsage: 9999,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
  {
    id: 4,
    code: "ADMINPRO",
    customerName: "Code Administrateur Test",
    customerPhone: null,
    status: "active",
    amount: 0,
    paymentMethod: "admin",
    usageCount: 0,
    maxUsage: 9999,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
  {
    id: 5,
    code: "CV19",
    customerName: "Code Promo Lancement",
    customerPhone: null,
    status: "active",
    amount: 19,
    paymentMethod: "promo",
    usageCount: 0,
    maxUsage: 9999,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
];

const inMemoryCodes = new Map<string, ActivationCode>(
  initialMasterCodes.map((c) => [c.code, c])
);

/**
 * ── Connexion à la Base de Données (MySQL / TiDB / PlanetScale / Aiven) ──
 */
export async function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!_db && dbUrl) {
    try {
      if (!_pool) {
        // Parse TiDB connection URI or URL string
        const cleanUrl = dbUrl.trim();
        if (cleanUrl.startsWith("mysql://") || cleanUrl.startsWith("mysql2://")) {
          const parsed = new URL(cleanUrl.replace(/^mysql2?:\/\//, "http://"));
          _pool = mysql.createPool({
            host: parsed.hostname,
            port: Number(parsed.port) || 4000,
            user: decodeURIComponent(parsed.username),
            password: decodeURIComponent(parsed.password),
            database: parsed.pathname.replace(/^\//, "") || "test",
            ssl: {
              rejectUnauthorized: true,
              minVersion: "TLSv1.2",
            },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
          });
        } else {
          _pool = mysql.createPool(cleanUrl);
        }
      }

      _db = drizzle(_pool);
      console.log("[Database] Connected successfully to TiDB Cloud MySQL");
    } catch (error) {
      console.warn("[Database] Connection failed, operating in resilient fallback mode:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

/**
 * ── 1. Vérification d'un Code d'Activation en BDD ou Store ──
 */
export async function getActivationCodeFromDb(code: string): Promise<ActivationCode | null> {
  const cleanCode = (code || "").trim().toUpperCase();

  try {
    const db = await getDb();
    if (db) {
      const results = await db
        .select()
        .from(activationCodes)
        .where(eq(activationCodes.code, cleanCode))
        .limit(1);

      if (results.length > 0) return results[0];
    }
  } catch (error) {
    console.error("[Database] Error querying activation code:", error);
  }

  // Fallback to in-memory store
  return inMemoryCodes.get(cleanCode) || null;
}

/**
 * ── 2. Récupérer tous les codes d'activation (pour le Dashboard Admin) ──
 */
export async function getAllActivationCodesFromDb(): Promise<ActivationCode[]> {
  try {
    const db = await getDb();
    if (db) {
      const results = await db
        .select()
        .from(activationCodes)
        .orderBy(desc(activationCodes.createdAt))
        .limit(100);

      if (results.length > 0) return results;
    }
  } catch (error) {
    console.error("[Database] Error fetching all activation codes from DB:", error);
  }

  // Return in-memory list
  return Array.from(inMemoryCodes.values());
}

/**
 * ── 3. Incrémentation de l'Utilisation d'un Code ──
 */
export async function recordCodeUsageInDb(code: string): Promise<boolean> {
  const cleanCode = (code || "").trim().toUpperCase();

  // Update in-memory store
  const memCode = inMemoryCodes.get(cleanCode);
  if (memCode) {
    memCode.usageCount += 1;
    memCode.lastUsedAt = new Date();
  }

  try {
    const db = await getDb();
    if (db) {
      await db
        .update(activationCodes)
        .set({
          usageCount: sql`${activationCodes.usageCount} + 1`,
          lastUsedAt: new Date(),
        })
        .where(eq(activationCodes.code, cleanCode));
      return true;
    }
  } catch (error) {
    console.error("[Database] Error updating code usage in DB:", error);
  }

  return true;
}

/**
 * ── 4. Création / Enregistrement d'un Nouveau Code d'Activation ──
 */
export async function createActivationCodeInDb(data: InsertActivationCode): Promise<boolean> {
  const cleanCode = (data.code || "").trim().toUpperCase();
  const newEntry: ActivationCode = {
    id: Date.now(),
    code: cleanCode,
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    amount: data.amount !== undefined ? Number(data.amount) : 19,
    paymentMethod: data.paymentMethod || "whatsapp",
    status: (data.status as any) || "active",
    usageCount: 0,
    maxUsage: data.maxUsage !== undefined ? Number(data.maxUsage) : 3,
    createdAt: new Date(),
    lastUsedAt: null,
    expiresAt: null,
  };

  // Always save in resilient in-memory store
  inMemoryCodes.set(cleanCode, newEntry);

  try {
    const db = await getDb();
    if (db) {
      await db.insert(activationCodes).values({
        ...data,
        code: cleanCode,
        createdAt: new Date(),
      });
    }
    return true;
  } catch (error) {
    console.warn("[Database] DB save failed, saved in resilient memory store:", error);
    return true;
  }
}

/**
 * ── 5. Modifier le statut d'un code (Activer / Révoquer) ──
 */
export async function updateCodeStatusInDb(code: string, status: "active" | "revoked"): Promise<boolean> {
  const cleanCode = (code || "").trim().toUpperCase();

  const memCode = inMemoryCodes.get(cleanCode);
  if (memCode) {
    memCode.status = status;
  }

  try {
    const db = await getDb();
    if (db) {
      await db
        .update(activationCodes)
        .set({ status })
        .where(eq(activationCodes.code, cleanCode));
    }
  } catch (error) {
    console.error("[Database] Error updating code status:", error);
  }

  return true;
}

/**
 * ── 6. Supprimer un code d'activation ──
 */
export async function deleteActivationCodeFromDb(code: string): Promise<boolean> {
  const cleanCode = (code || "").trim().toUpperCase();

  inMemoryCodes.delete(cleanCode);

  try {
    const db = await getDb();
    if (db) {
      await db.delete(activationCodes).where(eq(activationCodes.code, cleanCode));
    }
  } catch (error) {
    console.error("[Database] Error deleting activation code:", error);
  }

  return true;
}

/**
 * ── 7. Enregistrement des Statistiques de Création de CV ──
 */
export async function recordCvGenerationInDb(data: InsertCvGeneration): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.insert(cvGenerations).values({
        ...data,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Error saving CV analytics:", error);
  }
}

/**
 * ── 8. Récupérer les derniers CVs générés ──
 */
export async function getRecentCvGenerationsFromDb(limit = 20) {
  try {
    const db = await getDb();
    if (db) {
      return await db
        .select()
        .from(cvGenerations)
        .orderBy(desc(cvGenerations.createdAt))
        .limit(limit);
    }
  } catch (error) {
    console.error("[Database] Error fetching recent CVs:", error);
  }
  return [];
}

/**
 * ── 9. Statistiques Globales du SaaS (pour Dashboard Admin) ──
 */
export async function getSaaSStatsFromDb() {
  try {
    const db = await getDb();
    if (db) {
      const [codesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(activationCodes);

      const [revenue] = await db
        .select({ sum: sql<number>`sum(${activationCodes.amount})` })
        .from(activationCodes)
        .where(sql`${activationCodes.usageCount} > 0`);

      const [cvsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(cvGenerations);

      return {
        totalCodes: Number(codesCount?.count || inMemoryCodes.size),
        totalRevenueTND: Number(revenue?.sum || 0),
        totalCvCreated: Number(cvsCount?.count || 0),
        isDatabaseConnected: true,
      };
    }
  } catch (error) {
    console.error("[Database] Error calculating SaaS stats:", error);
  }

  // Fallback calculation
  const totalRev = Array.from(inMemoryCodes.values()).reduce(
    (acc, cur) => acc + (cur.usageCount > 0 ? (cur.amount || 19) : 0),
    0
  );

  return {
    totalCodes: inMemoryCodes.size,
    totalRevenueTND: totalRev,
    totalCvCreated: 0,
    isDatabaseConnected: false,
  };
}
