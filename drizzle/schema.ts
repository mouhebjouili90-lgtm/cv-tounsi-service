import { mysqlTable, serial, varchar, text, int, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * ── Table: Activation Codes (Codes d'activation & Paiements) ──
 * Stocke tous les codes d'activation générés, vendus ou promotionnels.
 */
export const activationCodes = mysqlTable("activation_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 128 }),
  customerPhone: varchar("customer_phone", { length: 32 }),
  amount: int("amount").default(19).notNull(), // 19 TND
  currency: varchar("currency", { length: 8 }).default("TND").notNull(),
  status: mysqlEnum("status", ["active", "used", "revoked", "expired"]).default("active").notNull(),
  usageCount: int("usage_count").default(0).notNull(),
  maxUsage: int("max_usage").default(10).notNull(), // autorise réédition/téléchargements multiples
  channel: varchar("channel", { length: 32 }).default("whatsapp").notNull(), // whatsapp, flouci, konnect, admin, promo
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
});

export type ActivationCode = typeof activationCodes.$inferSelect;
export type InsertActivationCode = typeof activationCodes.$inferInsert;

/**
 * ── Table: CV Analytics & Generations (Statistiques d'utilisation) ──
 */
export const cvGenerations = mysqlTable("cv_generations", {
  id: serial("id").primaryKey(),
  template: varchar("template", { length: 32 }).notNull(), // professional, canadian, europass
  language: varchar("language", { length: 8 }).notNull(), // fr, en, ar, de, it
  profileType: varchar("profile_type", { length: 16 }).notNull(), // experienced, student
  targetRole: varchar("target_role", { length: 128 }),
  isUnlocked: boolean("is_unlocked").default(false).notNull(),
  usedAiCount: int("used_ai_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CvGeneration = typeof cvGenerations.$inferSelect;
export type InsertCvGeneration = typeof cvGenerations.$inferInsert;

/**
 * ── Table: Users (Comptes Candidats & Administrateurs) ──
 */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  name: varchar("name", { length: 128 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 128 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  role: varchar("role", { length: 32 }).default("user").notNull(), // user, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ── Table: User Saved CVs (Sauvegarde automatique des CVs en BDD) ──
 */
export const userCvs = mysqlTable("user_cvs", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  dataJson: text("data_json").notNull(),
  template: varchar("template", { length: 32 }).default("professional").notNull(),
  language: varchar("language", { length: 8 }).default("fr").notNull(),
  isUnlocked: boolean("is_unlocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserCv = typeof userCvs.$inferSelect;
export type InsertUserCv = typeof userCvs.$inferInsert;
