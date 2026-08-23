import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "./db.js";

async function initTables() {
  console.log("[DB Init] Connecting to TiDB Cloud Database...");
  const db = await getDb();
  if (!db) {
    console.error("[DB Init] Database connection failed.");
    process.exit(1);
  }

  console.log("[DB Init] Creating/updating tables for CV Tounsi SaaS...");

  // 1. Users table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(128),
        password_hash VARCHAR(255),
        google_id VARCHAR(128),
        avatar_url VARCHAR(255),
        role VARCHAR(32) DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_login_at TIMESTAMP NULL
      )
    `);
    console.log("  ✓ Table 'users' verified / created.");
  } catch (e: any) {
    console.warn("  ℹ Users table create info:", e?.message);
  }

  // Ensure missing columns on users table if it existed with older schema
  const userColumns = [
    { name: "password_hash", type: "VARCHAR(255)" },
    { name: "google_id", type: "VARCHAR(128)" },
    { name: "avatar_url", type: "VARCHAR(255)" },
    { name: "last_login_at", type: "TIMESTAMP NULL" },
  ];

  for (const col of userColumns) {
    try {
      await db.execute(sql.raw(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`));
      console.log(`  ✓ Column '${col.name}' added to 'users'.`);
    } catch {
      // Column already exists, ignore
    }
  }

  // 2. User CVs table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_cvs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(128) NOT NULL,
        data_json MEDIUMTEXT NOT NULL,
        template VARCHAR(32) DEFAULT 'professional' NOT NULL,
        language VARCHAR(8) DEFAULT 'fr' NOT NULL,
        is_unlocked BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("  ✓ Table 'user_cvs' verified / created.");
  } catch (e: any) {
    console.warn("  ℹ user_cvs table create info:", e?.message);
  }

  // 3. Activation codes table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activation_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        customer_name VARCHAR(128),
        customer_phone VARCHAR(32),
        amount INT DEFAULT 19 NOT NULL,
        currency VARCHAR(8) DEFAULT 'TND' NOT NULL,
        status ENUM('active', 'used', 'revoked', 'expired') DEFAULT 'active' NOT NULL,
        usage_count INT DEFAULT 0 NOT NULL,
        max_usage INT DEFAULT 10 NOT NULL,
        channel VARCHAR(32) DEFAULT 'whatsapp' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMP NULL,
        last_used_at TIMESTAMP NULL
      )
    `);
    console.log("  ✓ Table 'activation_codes' verified / created.");
  } catch (e: any) {
    console.warn("  ℹ activation_codes table create info:", e?.message);
  }

  // 4. CV Generations analytics table
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cv_generations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        template VARCHAR(32) NOT NULL,
        language VARCHAR(8) NOT NULL,
        profile_type VARCHAR(16) NOT NULL,
        target_role VARCHAR(128),
        is_unlocked BOOLEAN DEFAULT FALSE NOT NULL,
        used_ai_count INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("  ✓ Table 'cv_generations' verified / created.");
  } catch (e: any) {
    console.warn("  ℹ cv_generations table create info:", e?.message);
  }

  console.log("[DB Init] All database tables are synchronized with TiDB Cloud!");
  process.exit(0);
}

initTables().catch((err) => {
  console.error("[DB Init] Error:", err);
  process.exit(1);
});
