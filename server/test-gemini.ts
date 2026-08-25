import dotenv from "dotenv";
dotenv.config();

async function testAllGeminiSteps() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  // 1. Test Experience improvement
  console.log("\n1️⃣ Testing Experience improvement (Step 2)...");
  const expRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: "Poste : Ingénieur Cybersécurité (Entreprise : SecuTech). Notes de missions : audit de sécurité, gestion des vulnérabilités, mise en place SIEM et pare-feu. Rédige 3 à 4 puces professionnelles d'impact commençant par •." }]
      }],
      systemInstruction: {
        parts: [{ text: "Tu es un expert RH et spécialiste ATS. Rédige UNIQUEMENT 3 à 4 puces concises d'impact professionnel. Chaque puce commence obligatoirement par •. Aucun autre texte." }]
      },
      generationConfig: { temperature: 0.25, maxOutputTokens: 2048 }
    })
  });
  const expData = await expRes.json();
  console.log("Experience Output:\n", expData.candidates?.[0]?.content?.parts?.[0]?.text);

  // 2. Test Skills suggestion
  console.log("\n2️⃣ Testing Skills suggestion (Step 3)...");
  const skillsRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: "Domaine / Métier visé : Cybersécurité / Sécurité des Systèmes d'Information. Propose 8 à 10 compétences clés techniques et méthodologiques séparées par des points médians · ." }]
      }],
      systemInstruction: {
        parts: [{ text: "Tu es un recruteur expert en technologies. Donne UNIQUEMENT une liste de 8 à 10 compétences clés (outils, normes, hard skills, soft skills) séparées par · . Aucun autre texte." }]
      },
      generationConfig: { temperature: 0.25, maxOutputTokens: 2048 }
    })
  });
  const skillsData = await skillsRes.json();
  console.log("Skills Output:\n", skillsData.candidates?.[0]?.content?.parts?.[0]?.text);

  process.exit(0);
}

testAllGeminiSteps();
