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
 * Enregistre les CVs créés pour analyser les tendances (métiers les plus demandés, langues, etc.)
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
 * ── Table: Admin Users (Gestionnaires du SaaS) ──
 */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 191 }).unique(),
  name: varchar("name", { length: 128 }),
  role: varchar("role", { length: 32 }).default("user").notNull(), // admin, user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
