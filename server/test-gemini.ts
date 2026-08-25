import dotenv from "dotenv";
dotenv.config();

async function testCybersecurityPrompt() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  const rawSummary = "cybersecurité";
  const rawRole = "Marketing & Communication Specialist"; // default placeholder in sample
  
  // Our new domain logic:
  let domain = rawSummary.length > 0 && rawSummary.length < 80 
    ? rawSummary 
    : rawRole;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `Rédige l'accroche de CV pour ce profil : "${rawSummary}". Intitulé ou domaine : "${domain}".` }]
      }
    ],
    systemInstruction: {
      parts: [{ text: `Tu es un expert RH de direction. Rédige UNIQUEMENT un paragraphe d'accroche professionnelle de 2 à 3 phrases percutantes en français pour un profil dans le domaine/poste "${domain}". Valorise l'expertise, les résultats, la rigueur et la valeur ajoutée métier. Interdiction de mettre des titres, des puces, des guillemets ou des alternatives. Réponds UNIQUEMENT avec le texte final du CV.` }]
    },
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 2048,
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  console.log("\nGenerated text with 'cybersecurité' input:");
  console.log("-----------------------------------------");
  console.log(text?.trim());
  console.log("-----------------------------------------");

  process.exit(0);
}

testCybersecurityPrompt();
