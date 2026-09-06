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

export interface MarketFitScores {
  professional: number; // Score d'adéquation Tunisie / Golfe / Privé (0-100)
  canadian: number;     // Score d'adéquation Canada / ATS (0-100)
  europass: number;     // Score d'adéquation Europe / UE (0-100)
}

export interface CvScanFeedback {
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface CvScanOutput {
  rating: number;
  atsScore: number;
  marketFit: MarketFitScores;
  recommendedTemplate: "professional_executive" | "canadian_classic" | "europass_classic";
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
    text: `Tu es un Directeur de Recrutement RH International et Auditeur Expert de CV.
Notre plateforme propose 3 grands standards officiels de CV :
1. Standard Professionnel Exécutif ('professional_executive') : Idéal pour les entreprises en Tunisie, le Golfe, les multinationales et le secteur privé (structure 2 colonnes soignée, compétences valorisées, présentation moderne).
2. Standard Canadien ATS ('canadian_classic') : Format nord-américain 1 colonne épuré, optimisé 100% pour les robots ATS (Taleo, Workday), sans photo, anti-discrimination.
3. Standard Européen Europass ('europass_classic') : Format officiel reconnu dans toute l'Union Européenne (France, Allemagne, Italie, Belgique, bourses et recherche).

Mission d'analyse :
1. Analyse minutieusement le CV fourni.
2. Note globale de qualité sur 100 ('rating', entre 40 et 95) basée sur la clarté, l'impact et la complétude.
3. Score de conformité ATS sur 100 ('atsScore', entre 35 et 95) basé sur la lisibilité par les algorithmes de filtrage.
4. Évalue l'adéquation ('marketFit', sur 100) pour CHACUN des 3 marchés :
   - 'professional' : pertinence pour le marché local tunisien, pays du Golfe et entreprises privées.
   - 'canadian' : pertinence pour l'immigration et l'emploi au Canada / États-Unis.
   - 'europass' : pertinence pour l'Union Européenne (France, UE, stages, mobilité).
5. Recommande le modèle le plus adapté ('recommendedTemplate') parmi : 'professional_executive', 'canadian_classic', 'europass_classic'.
6. Rédige 2 à 3 points forts ('strengths') et 2 à 3 points à corriger ('weaknesses') en arabe professionnel clair et encourageant.
7. Rédige un diagnostic synthétique de 1 à 2 phrases en arabe ('summary') qui conseille objectivement le candidat.
8. Extrais et normalise avec soin toutes les données du candidat pour les mapper au schéma ci-dessous (améliore le 'profileSummary' et corrige les fautes).

Réponds UNIQUEMENT avec un JSON strict sans balises markdown au format suivant :
{
  "rating": 76,
  "atsScore": 68,
  "marketFit": {
    "professional": 84,
    "canadian": 68,
    "europass": 78
  },
  "recommendedTemplate": "professional_executive",
  "feedback": {
    "strengths": [
      "مسار أكاديمي ومهني واضح ومنظم",
      "وضوح معلومات الاتصال والمسمى الوظيفي"
    ],
    "weaknesses": [
      "نقص في الأرقام والإنجازات القابلة للقياس داخل التجارب",
      "الحاجة إلى تحسين الكلمات المفتاحية لزيادة قوة الملف أمام لجان التوظيف"
    ],
    "summary": "سيرة ذاتية واعدة تمتلك مقومات قوية، ومن شأن نقلها لنموذج احترافي تنفيذي أو أوروبي مضاعفة فرصك في القبول."
  },
  "extractedCv": {
    "profileType": "experienced",
    "fullName": "Nom Prénom",
    "targetRole": "Poste ciblé",
    "city": "Ville, Pays",
    "email": "email@example.com",
    "phone": "+216 XX XXX XXX",
    "profileSummary": "Résumé professionnel percutant rédigé par l'IA...",
    "experiences": [
      {
        "id": "exp-1",
        "role": "Poste occupé",
        "company": "Entreprise",
        "dates": "2022 - Présent",
        "location": "Tunis, Tunisie",
        "description": "Missions et réalisations mesurables..."
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
    "template": "professional_executive"
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

  // Normaliser marketFit si absent ou partiel
  const baseRating = typeof jsonResult.rating === "number" ? jsonResult.rating : 70;
  const baseAts = typeof jsonResult.atsScore === "number" ? jsonResult.atsScore : 65;

  if (!jsonResult.marketFit || typeof jsonResult.marketFit !== "object") {
    jsonResult.marketFit = {
      professional: Math.min(95, Math.max(45, baseRating + 5)),
      canadian: Math.min(95, Math.max(35, baseAts)),
      europass: Math.min(95, Math.max(40, Math.round((baseRating + baseAts) / 2))),
    };
  } else {
    jsonResult.marketFit = {
      professional: typeof jsonResult.marketFit.professional === "number" ? jsonResult.marketFit.professional : Math.min(95, Math.max(45, baseRating + 5)),
      canadian: typeof jsonResult.marketFit.canadian === "number" ? jsonResult.marketFit.canadian : Math.min(95, Math.max(35, baseAts)),
      europass: typeof jsonResult.marketFit.europass === "number" ? jsonResult.marketFit.europass : Math.min(95, Math.max(40, Math.round((baseRating + baseAts) / 2))),
    };
  }

  // Normaliser recommendedTemplate
  let rec = jsonResult.recommendedTemplate || jsonResult.extractedCv?.template || "professional_executive";
  if (typeof rec === "string") {
    if (rec.includes("canad") || rec.includes("ats")) rec = "canadian_classic";
    else if (rec.includes("euro")) rec = "europass_classic";
    else rec = "professional_executive";
  } else {
    rec = "professional_executive";
  }
  jsonResult.recommendedTemplate = rec;

  if (jsonResult.extractedCv) {
    jsonResult.extractedCv.template = rec;
  }

  return jsonResult as CvScanOutput;
}
