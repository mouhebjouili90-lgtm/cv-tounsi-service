import { isCvTounsiMessage, generateArabicBotReply } from "./whatsapp-bot.js";

async function runTests() {
  console.log("=== TEST 1: Filtrage des Messages Multi-Business ===");

  const testMessages = [
    { text: "Bonjour, je souhaite des informations sur CV Tounsi", expected: true },
    { text: "سلام خويا نحب نخدم CV كندا قداش سومو؟", expected: true },
    { text: "قداش رقم الـ D17 باش نخلص 12.900 ؟", expected: true },
    { text: "Bonjour, est-ce que vous avez des parfums disponibles ?", expected: false }, // Autre commerce
    { text: "Salem, win mawjoud el محل متاعكم ؟", expected: false }, // Autre commerce
  ];

  for (const m of testMessages) {
    const isCv = await isCvTounsiMessage(m.text);
    console.log(`Message: "${m.text}"`);
    console.log(`-> Détecté CV Tounsi ? ${isCv} (Attendu: ${m.expected}) ${isCv === m.expected ? "✅ OK" : "❌ ERREUR"}\n`);
  }

  console.log("=== TEST 2: Génération de Réponse IA en Arabe ===");
  const reply = await generateArabicBotReply("Bonjour, je souhaite des informations sur CV Tounsi", "Mohamed");
  console.log("Réponse générée par le Bot IA :\n---------------------------------");
  console.log(reply);
  console.log("---------------------------------");
}

runTests().catch(console.error);
