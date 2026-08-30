import { isCvTounsiMessage, generateArabicBotReply } from "./whatsapp-bot.js";

async function runTests() {
  console.log("=== TEST NOUVEAU MESSAGE ARABE REÇU ===");
  const testMessage = "نحب نفعّل CV Tounsi متاعي 🫒";
  const isCv = await isCvTounsiMessage(testMessage);
  console.log(`Message entrant: "${testMessage}"`);
  console.log(`-> Détecté CV Tounsi ? ${isCv} ✅\n`);

  console.log("=== GÉNÉRATION RÉPONSE IA EN ARABE TUNISIEN MAÎTRISÉ ===");
  const reply = await generateArabicBotReply(testMessage, "Sarra");
  console.log("Réponse du Bot IA :\n---------------------------------");
  console.log(reply);
  console.log("---------------------------------");
}

runTests().catch(console.error);
