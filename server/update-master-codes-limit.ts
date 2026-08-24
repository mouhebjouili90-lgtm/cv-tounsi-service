import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb, getAllActivationCodesFromDb } from "./db.js";

async function updateMasterLimits() {
  console.log("[Limit Update] Connecting to TiDB Cloud Database...");
  const db = await getDb();
  if (!db) {
    console.error("[Limit Update] Database connection failed.");
    process.exit(1);
  }

  console.log("[Limit Update] Updating max_usage on master codes...");

  // Update master codes in TiDB Cloud
  try {
    await db.execute(sql`
      UPDATE activation_codes 
      SET max_usage = CASE 
        WHEN code = 'ADMINPRO' THEN 100 
        WHEN code IN ('TN19', 'PRO19', 'CV19') THEN 50 
        WHEN code = 'VIP19' THEN 20 
        WHEN max_usage > 100 THEN 10 
        ELSE max_usage 
      END
      WHERE max_usage > 100
    `);
    console.log("  ✓ Updated max_usage in database for all legacy master codes!");
  } catch (e: any) {
    console.warn("  ℹ Update info:", e?.message);
  }

  const allCodes = await getAllActivationCodesFromDb();
  console.log("\n[Limit Update] Codes actuels et leurs limites :");
  for (const c of allCodes) {
    console.log(`  - Code: ${c.code.padEnd(12)} | Utilisations: ${c.usageCount} / ${c.maxUsage} | Statut: ${c.status}`);
  }

  process.exit(0);
}

updateMasterLimits().catch((err) => {
  console.error("[Limit Update] Error:", err);
  process.exit(1);
});
