import "dotenv/config";
import {
  validateActivationCode,
  generateActivationToken,
  verifyActivationToken,
} from "./activation-server";
import {
  createActivationCodeInDb,
  getActivationCodeFromDb,
  getDb,
} from "./db";

async function runActivationVerification() {
  console.log("==================================================");
  console.log("🧪 Test Complet : Validation des Codes en BDD (Étape 1.4)");
  console.log("==================================================");

  const db = await getDb();
  if (!db) {
    console.error("❌ Erreur : Impossible de se connecter à TiDB Cloud.");
    process.exit(1);
  }
  console.log("✅ Connexion BDD active.");

  // 1. Créer un code client unique de test
  const testCode = `TEST${Date.now().toString().slice(-6)}`;
  console.log(`\n1️⃣ Création d'un code client en BDD : ${testCode}`);
  const created = await createActivationCodeInDb({
    code: testCode,
    customerName: "Mohamed Trabelsi",
    customerPhone: "+216 95 669 209",
    amount: 19,
    channel: "whatsapp",
    status: "active",
    maxUsage: 3,
  });

  if (!created) {
    console.error("❌ Échec de création du code en BDD");
    process.exit(1);
  }
  console.log("✅ Code inséré avec succès en BDD.");

  // 2. Valider le code via le serveur
  console.log(`\n2️⃣ Test de validation du code : ${testCode}`);
  const isValid = await validateActivationCode(testCode, "Mohamed Trabelsi");
  console.log(`Résultat validation : ${isValid ? "✅ VALIDE" : "❌ INVALIDE"}`);

  if (!isValid) {
    console.error("❌ Le code devrait être valide !");
    process.exit(1);
  }

  // 3. Vérifier l'incrémentation en BDD
  const dbRecord = await getActivationCodeFromDb(testCode);
  console.log(`\n3️⃣ Vérification de l'état en BDD après validation :`);
  console.log(`  - Code : ${dbRecord?.code}`);
  console.log(`  - Nombre d'utilisations : ${dbRecord?.usageCount} / ${dbRecord?.maxUsage}`);
  console.log(`  - Dernière utilisation : ${dbRecord?.lastUsedAt}`);

  if (dbRecord?.usageCount !== 1) {
    console.error("❌ Le compteur d'utilisation n'a pas été incrémenté en BDD !");
    process.exit(1);
  }
  console.log("✅ Compteur d'utilisation incrémenté en BDD.");

  // 4. Générer et vérifier le token HMAC
  console.log(`\n4️⃣ Test de génération et signature du token HMAC :`);
  const token = generateActivationToken("Mohamed Trabelsi");
  console.log(`  - Token signé : ${token.slice(0, 30)}...`);

  const tokenVerification = verifyActivationToken(token);
  console.log(`  - Vérification signature : ${tokenVerification.valid ? "✅ VALIDE" : "❌ INVALIDE"}`);
  console.log(`  - Nom décodé du token : ${tokenVerification.name}`);

  if (!tokenVerification.valid || tokenVerification.name !== "Mohamed Trabelsi") {
    console.error("❌ Le token HMAC est invalide !");
    process.exit(1);
  }

  // 5. Test de sécurité : codes devinables avec préfixes/suffixes arbitraires
  console.log(`\n5️⃣ Test de sécurité : vérification du rejet des codes devinables`);
  const fakeCodes = ["HACK1234", "TN1234", "CVABCD", "PRO9999", "RANDOM19", "FAKEPASS"];
  
  for (const fake of fakeCodes) {
    const isAccepted = await validateActivationCode(fake, "Candidat Test");
    console.log(`  - Code "${fake}" : ${!isAccepted ? "✅ REJETÉ AVEC SUCCÈS" : "❌ ACCEPTÉ PAR ERREUR"}`);
    if (isAccepted) {
      console.error(`❌ La sécurité a échoué : le faux code "${fake}" a été accepté !`);
      process.exit(1);
    }
  }

  console.log("\n==================================================");
  console.log("🎉 TOUS LES TESTS DE VALIDATION SERVEUR SONT VALIDÉS !");
  console.log("==================================================");
  process.exit(0);
}

runActivationVerification().catch((err) => {
  console.error("Erreur test activation :", err);
  process.exit(1);
});
