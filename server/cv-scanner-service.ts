/**
 * CV Tounsi — Service IA d'analyse, de notation ATS et d'extraction de CV
 * Compatible avec gemini-3.6-flash, gemini-3.5-flash, gemini-3.7-flash
 */

export interface ProcessCvScanParams {
  fileBase64?: string;
  mimeType?: string;
  rawText?: string;
  fileName?: string;
}

export interface CvScanFeedback {
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface CvScanOutput {
  rating: number;
  atsScore: number;
  feedback: CvScanFeedback;
  extractedCv: Record<string, any>;
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
];

export async function processCvScan(params: ProcessCvScanParams): Promise<CvScanOutput> {
  const { fileBase64, mimeType, rawText } = params;
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "").replace(/^Bearer\s+/i, "").trim();

  if (!apiKey) {
    throw new Error("Service IA non configuré sur le serveur (clé GEMINI_API_KEY manquante).");
  }

  if (!fileBase64 && !rawText) {
    throw new Error("Veuillez fournir un fichier ou du texte de CV.");
  }

  // Nettoyer les préfixes Data-URI
  let cleanBase64 = fileBase64 || "";
  let detectedMime = mimeType || "application/pdf";
  if (cleanBase64.includes(";base64,")) {
    const splitted = cleanBase64.split(";base64,");
    detectedMime = splitted[0].replace("data:", "") || detectedMime;
    cleanBase64 = splitted[1];
  }

  // Pour DOCX/DOC si envoyé en mime binaire générique sans support multimodal direct de Gemini,
  // Gemini gère nativement application/pdf, image/jpeg, image/png, image/webp, text/plain.
  // Si le mime est Word (.docx), nous le spécifions comme application/pdf ou nous informons
  if (detectedMime.includes("word") || detectedMime.includes("officedocument")) {
    detectedMime = "application/pdf";
  }

  const parts: any[] = [];

  if (cleanBase64) {
    parts.push({
      inlineData: {
        mimeType: detectedMime,
        data: cleanBase64,
      },
    });
  } else if (rawText) {
    parts.push({
      text: `Voici le texte complet du CV à analyser :\n\n${rawText}`,
    });
  }

  parts.push({
    text: `En tant qu'auditeur ATS international et expert en recrutement RH (Tunisie, Canada, Europe) :
1. Analyse minutieusement ce CV.
2. Attribue une note globale de qualité sur 100 ('rating', entre 35 et 95) et un score de conformité aux filtres ATS sur 100 ('atsScore').
3. Identifie 2 à 3 points forts concrets ('strengths') et 2 à 3 axes d'amélioration critiques ('weaknesses') rédigés en arabe clair et professionnel.
4. Rédige un diagnostic synthétique de 1 à 2 phrases en arabe ('summary').
5. Extrais et normalise avec soin toutes les données du candidat pour les mapper exactement au schéma de données demandé ci-dessous.
   - Améliore le résumé professionnel ('profileSummary') pour qu'il soit accrocheur et percutant.
   - Corrige les petites fautes d'orthographe ou de formulation dans les descriptions d'expériences.
   - Identifie si le candidat est plutôt 'experienced' ou 'student'.
   - Recommande le template le plus adapté parmi: 'canadian_classic', 'canadian_modern', 'europass_classic', 'professional_executive', 'professional_modern'.

Réponds UNIQUEMENT avec un JSON strict sans balises markdown au format suivant :
{
  "rating": 65,
  "atsScore": 58,
  "feedback": {
    "strengths": [
      "مسار دراسي وأكاديمي واضح ومكتمل",
      "معلومات الاتصال واضحة ومباشرة"
    ],
    "weaknesses": [
      "غياب الكلمات المفتاحية الأساسية لمطابقة روبوتات ATS",
      "نقص في الأرقام والإنجازات الملموسة في التجارب المهنية"
    ],
    "summary": "سيرة ذاتية واعدة وقابلة للتطوير بشكل كبير عند استخدام النموذج الكندي المعتمد."
  },
  "extractedCv": {
    "profileType": "experienced",
    "fullName": "Nom Prénom",
    "targetRole": "Poste ciblé",
    "city": "Ville, Pays",
    "email": "email@example.com",
    "phone": "+216 XX XXX XXX",
    "profileSummary": "Résumé professionnel percutant...",
    "experiences": [
      {
        "id": "exp-1",
        "role": "Poste occupé",
        "company": "Entreprise",
        "dates": "2022 - Présent",
        "location": "Tunis, Tunisie",
        "description": "Missions et réalisations..."
      }
    ],
    "educations": [
      {
        "id": "edu-1",
        "degree": "Diplôme obtenu",
        "school": "Université / Faculté",
        "year": "2020 - 2023",
        "location": "Tunis"
      }
    ],
    "skills": "Compétence 1, Compétence 2, Compétence 3",
    "languagesList": "Français (Courant), Arabe (Maternelle), Anglais (Intermédiaire)",
    "language": "fr",
    "template": "canadian_classic"
  }
}`,
  });

  const payload: any = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 4000,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  let lastError = null;
  let jsonResult: any = null;

  try {
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const geminiRes = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.warn(`[CV Scanner Service] Model ${model} status ${geminiRes.status}:`, errText);
          if (geminiRes.status === 401) {
            lastError = `خطأ مصادقة مع Google Gemini (401). تأكد من صحة وصلاحية مفتاح GEMINI_API_KEY على السيرفر.`;
          } else {
            lastError = `Erreur Gemini (${geminiRes.status}): ${errText}`;
          }
          continue;
        }

        const geminiData = await geminiRes.json();
        const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

        let cleanOutput = rawOutput.trim();
        if (cleanOutput.startsWith("```json")) {
          cleanOutput = cleanOutput.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        } else if (cleanOutput.startsWith("```")) {
          cleanOutput = cleanOutput.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        jsonResult = JSON.parse(cleanOutput);
        break; // Modèle exécuté avec succès !
      } catch (err: any) {
        lastError = err?.message;
        console.warn(`[CV Scanner Service] Model ${model} exception:`, err?.message);
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (!jsonResult) {
    throw new Error(lastError || "Impossible d'extraire les données du CV.");
  }

  // Normaliser les IDs si absents
  if (jsonResult.extractedCv?.experiences && Array.isArray(jsonResult.extractedCv.experiences)) {
    jsonResult.extractedCv.experiences = jsonResult.extractedCv.experiences.map((exp: any, idx: number) => ({
      id: exp.id || `exp-${idx + 1}`,
      role: exp.role || "",
      company: exp.company || "",
      dates: exp.dates || "",
      location: exp.location || "",
      description: exp.description || "",
    }));
  }

  if (jsonResult.extractedCv?.educations && Array.isArray(jsonResult.extractedCv.educations)) {
    jsonResult.extractedCv.educations = jsonResult.extractedCv.educations.map((edu: any, idx: number) => ({
      id: edu.id || `edu-${idx + 1}`,
      degree: edu.degree || "",
      school: edu.school || "",
      year: edu.year || "",
      location: edu.location || "",
    }));
  }

  return jsonResult as CvScanOutput;
}
