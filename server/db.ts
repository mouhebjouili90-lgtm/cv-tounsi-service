import "dotenv/config";
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/tidb-serverless";
import { connect } from "@tidbcloud/serverless";
import {
  activationCodes,
  cvGenerations,
  users,
  userCvs,
  type ActivationCode,
  type InsertActivationCode,
  type InsertCvGeneration,
  type User,
  type InsertUser,
  type UserCv,
  type InsertUserCv,
} from "../drizzle/schema.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: any = null;

// ── In-Memory Resilient Store (Always ready even if DB is offline or cold-starting) ──
const initialMasterCodes: ActivationCode[] = [
  {
    id: 1,
    code: "TN19",
    customerName: "Code Universel Tunisie",
    customerPhone: "+216 95 669 209",
    status: "active",
    channel: "whatsapp",
    notes: null,
    usageCount: 0,
    maxUsage: 50, // Limite raisonnable
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
    currency: "TND",
    channel: "admin",
    notes: null,
    usageCount: 0,
    maxUsage: 50,
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
    currency: "TND",
    channel: "admin",
    notes: null,
    usageCount: 0,
    maxUsage: 20,
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
    currency: "TND",
    channel: "admin",
    notes: null,
    usageCount: 0,
    maxUsage: 100, // Limite stricte pour administrateur
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
    currency: "TND",
    channel: "promo",
    notes: null,
    usageCount: 0,
    maxUsage: 50,
    createdAt: new Date("2026-08-20"),
    lastUsedAt: null,
    expiresAt: null,
  },
];

const inMemoryCodes = new Map<string, ActivationCode>(
  initialMasterCodes.map((c) => [c.code, c])
);

const inMemoryUsers = new Map<string, User>();
const inMemoryUserCvs = new Map<number, UserCv>();
let nextUserId = 100;
let nextCvId = 100;

/**
 * ── Connexion à la Base de Données (MySQL / TiDB / PlanetScale / Aiven) ──
 */
export async function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!_db && dbUrl) {
    try {
      if (!_pool) {
        // Use TiDB Serverless HTTP driver for Vercel/Edge compatibility
        _pool = connect({ url: dbUrl.trim() });
      }

      _db = drizzle(_pool);
      console.log("[Database] Connected successfully to TiDB Cloud Serverless (HTTP)");
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
    currency: data.currency || "TND",
    channel: data.channel || "whatsapp",
    notes: data.notes || null,
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

/**
 * ── 10. Gestion des Utilisateurs (Auth Email & Google) ──
 */

export async function findUserByEmailInDb(email: string): Promise<User | null> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const db = await getDb();
    if (db) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);
      if (found) return found;
    }
  } catch (error) {
    console.error("[Database] Error finding user by email:", error);
  }

  return inMemoryUsers.get(cleanEmail) || null;
}

export async function findUserByIdInDb(id: number): Promise<User | null> {
  try {
    const db = await getDb();
    if (db) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (found) return found;
    }
  } catch (error) {
    console.error("[Database] Error finding user by id:", error);
  }

  return Array.from(inMemoryUsers.values()).find((u) => u.id === id) || null;
}

export async function findUserByGoogleIdInDb(googleId: string): Promise<User | null> {
  if (!googleId) return null;

  try {
    const db = await getDb();
    if (db) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);
      if (found) return found;
    }
  } catch (error) {
    console.error("[Database] Error finding user by Google ID:", error);
  }

  return Array.from(inMemoryUsers.values()).find((u) => u.googleId === googleId) || null;
}

export async function createUserInDb(data: {
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  role?: string;
}): Promise<User> {
  const cleanEmail = data.email.trim().toLowerCase();
  const newUser: User = {
    id: ++nextUserId,
    email: cleanEmail,
    name: data.name || cleanEmail.split("@")[0],
    passwordHash: data.passwordHash || null,
    googleId: data.googleId || null,
    avatarUrl: data.avatarUrl || null,
    role: data.role || "user",
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  inMemoryUsers.set(cleanEmail, newUser);

  try {
    const db = await getDb();
    if (db) {
      await db.insert(users).values({
        email: cleanEmail,
        name: newUser.name,
        passwordHash: newUser.passwordHash,
        googleId: newUser.googleId,
        avatarUrl: newUser.avatarUrl,
        role: newUser.role,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
      // Fetch the created record to get the auto-increment id
      const [saved] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (saved) return saved;
    }
  } catch (error) {
    console.warn("[Database] Error creating user in DB, saved in resilient memory store:", error);
  }

  return newUser;
}

export async function updateUserLastLoginInDb(id: number): Promise<void> {
  const now = new Date();
  const user = Array.from(inMemoryUsers.values()).find((u) => u.id === id);
  if (user) {
    user.lastLoginAt = now;
  }

  try {
    const db = await getDb();
    if (db) {
      await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, id));
    }
  } catch (error) {
    console.error("[Database] Error updating user last login:", error);
  }
}

export async function updateUserPlanInDb(id: number, plan: "student" | "pro"): Promise<void> {
  const roleName = plan === "pro" ? "pro" : "student";
  const user = Array.from(inMemoryUsers.values()).find((u) => u.id === id);
  if (user) {
    user.role = roleName;
  }

  try {
    const db = await getDb();
    if (db) {
      await db.update(users).set({ role: roleName }).where(eq(users.id, id));
      if (plan === "pro") {
        // Unlock all CVs for Pro user
        await db.update(userCvs).set({ isUnlocked: true }).where(eq(userCvs.userId, id));
      }
    }
  } catch (error) {
    console.error("[Database] Error updating user plan:", error);
  }
}

/**
 * ── 11. Sauvegarde et Gestion des CVs Utilisateurs ──
 */

export async function saveUserCvInDb(data: {
  id?: number;
  userId: number;
  title: string;
  dataJson: string;
  template?: string;
  language?: string;
  isUnlocked?: boolean;
}): Promise<UserCv> {
  const now = new Date();

  if (data.id) {
    // Update existing CV
    const existing = inMemoryUserCvs.get(data.id);
    if (existing && existing.userId === data.userId) {
      existing.title = data.title;
      existing.dataJson = data.dataJson;
      existing.template = data.template || existing.template;
      existing.language = data.language || existing.language;
      existing.isUnlocked = data.isUnlocked !== undefined ? data.isUnlocked : existing.isUnlocked;
      existing.updatedAt = now;
    }

    try {
      const db = await getDb();
      if (db) {
        await db
          .update(userCvs)
          .set({
            title: data.title,
            dataJson: data.dataJson,
            template: data.template || "professional",
            language: data.language || "fr",
            isUnlocked: data.isUnlocked || false,
            updatedAt: now,
          })
          .where(sql`${userCvs.id} = ${data.id} AND ${userCvs.userId} = ${data.userId}`);
        
        const [updated] = await db.select().from(userCvs).where(eq(userCvs.id, data.id)).limit(1);
        if (updated) return updated;
      }
    } catch (error) {
      console.error("[Database] Error updating user CV:", error);
    }

    return existing || {
      id: data.id,
      userId: data.userId,
      title: data.title,
      dataJson: data.dataJson,
      template: data.template || "professional",
      language: data.language || "fr",
      isUnlocked: data.isUnlocked || false,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Create new CV
  const newCv: UserCv = {
    id: ++nextCvId,
    userId: data.userId,
    title: data.title || "Mon CV Tounsi",
    dataJson: data.dataJson,
    template: data.template || "professional",
    language: data.language || "fr",
    isUnlocked: data.isUnlocked || false,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryUserCvs.set(newCv.id, newCv);

  try {
    const db = await getDb();
    if (db) {
      await db.insert(userCvs).values({
        userId: data.userId,
        title: newCv.title,
        dataJson: newCv.dataJson,
        template: newCv.template,
        language: newCv.language,
        isUnlocked: newCv.isUnlocked,
        createdAt: now,
        updatedAt: now,
      });

      const [saved] = await db
        .select()
        .from(userCvs)
        .where(sql`${userCvs.userId} = ${data.userId}`)
        .orderBy(desc(userCvs.createdAt))
        .limit(1);
      if (saved) return saved;
    }
  } catch (error) {
    console.warn("[Database] Error inserting user CV into DB, stored in memory fallback:", error);
  }

  return newCv;
}

export async function getUserCvsFromDb(userId: number): Promise<UserCv[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db
        .select()
        .from(userCvs)
        .where(eq(userCvs.userId, userId))
        .orderBy(desc(userCvs.updatedAt));
    }
  } catch (error) {
    console.error("[Database] Error fetching user CVs:", error);
  }

  return Array.from(inMemoryUserCvs.values())
    .filter((cv) => cv.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function deleteUserCvFromDb(userId: number, cvId: number): Promise<boolean> {
  const existing = inMemoryUserCvs.get(cvId);
  if (existing && existing.userId === userId) {
    inMemoryUserCvs.delete(cvId);
  }

  try {
    const db = await getDb();
    if (db) {
      await db
        .delete(userCvs)
        .where(sql`${userCvs.id} = ${cvId} AND ${userCvs.userId} = ${userId}`);
    }
  } catch (error) {
    console.error("[Database] Error deleting user CV:", error);
  }

  return true;
}
