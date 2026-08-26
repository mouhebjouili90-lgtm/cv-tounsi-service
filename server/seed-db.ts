import "dotenv/config";
import { getDb, createActivationCodeInDb, getSaaSStatsFromDb } from "./db";

async function seed() {
  console.log("[Seed] Connecting to TiDB Cloud Database...");
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Failed to connect to database. Check DATABASE_URL in .env");
    process.exit(1);
  }

  const initialCodes = [
    { code: "TN13", customerName: "Pass Étudiant / Urgence (12.9 TND)", channel: "promo", amount: 13, maxUsage: 9999 },
    { code: "ETUDIANT13", customerName: "Promo Étudiant INSAT/FST/ENIT", channel: "promo", amount: 13, maxUsage: 9999 },
    { code: "PASS13", customerName: "Pass Étudiant 13 TND", channel: "promo", amount: 13, maxUsage: 9999 },
    { code: "PRO25", customerName: "Pass Pro / Exécutif (24.9 TND)", channel: "promo", amount: 25, maxUsage: 9999 },
    { code: "VIP25", customerName: "Pass VIP 25 TND", channel: "promo", amount: 25, maxUsage: 9999 },
    { code: "PASS25", customerName: "Pass Recherche Active 25 TND", channel: "promo", amount: 25, maxUsage: 9999 },
    { code: "TN19", customerName: "Promo Tunisie 19 TND", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "CV19", customerName: "Promo Standard CV19", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "TOUNSI19", customerName: "Pass CV Tounsi 19", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "TOUNSI2026", customerName: "Pass Annuel 2026", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "PRO19", customerName: "Pass Professionnel", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "VIP19", customerName: "Pass VIP Candidat", channel: "promo", amount: 19, maxUsage: 9999 },
    { code: "ADMINPRO", customerName: "Admin Master Pass", channel: "admin", amount: 0, maxUsage: 99999 },
  ];

  console.log(`[Seed] Seeding ${initialCodes.length} master codes into activation_codes table...`);

  for (const item of initialCodes) {
    try {
      await createActivationCodeInDb({
        code: item.code,
        customerName: item.customerName,
        channel: item.channel,
        amount: item.amount,
        maxUsage: item.maxUsage,
        status: "active",
      });
      console.log(`  ✓ Code créé : ${item.code}`);
    } catch (e: any) {
      console.log(`  ℹ Code déjà existant : ${item.code}`);
    }
  }

  const stats = await getSaaSStatsFromDb();
  console.log("[Seed] Base de données initialisée avec succès !");
  console.log("[Seed] Statistiques actuelles :", stats);
  process.exit(0);
}

seed().catch((err) => {
  console.error("[Seed] Error:", err);
  process.exit(1);
});
