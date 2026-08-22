/* CV Tounsi — Module haute performance Google Gemini 3.6 Flash (Le modèle le plus rapide et fiable) */
import dotenv from "dotenv";
dotenv.config();

export const FASTEST_MODEL = "gemini-3.6-flash";

export async function callGemini({
  prompt,
  systemInstruction,
  responseSchema,
}: {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: Record<string, any>;
}): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured in environment");
  }

  const startTime = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${FASTEST_MODEL}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2, // Faible température pour un résultat ultra-fiable et cohérent
      topP: 0.85,
      maxOutputTokens: 1024, // Limité pour une génération instantanée
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (responseSchema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = responseSchema;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini API] Error ${response.status}:`, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    throw new Error("Empty response received from Gemini.");
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Gemini 3.6 Flash] Generated response in ${durationMs}ms`);

  return candidateText;
}
