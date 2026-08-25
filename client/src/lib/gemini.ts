/* CV Tounsi — Moteur IA Ultra-Performant avec Google Gemini 3.6 Flash
   Génération sur-mesure & dynamique selon le profil de chaque candidat */

export type ProfileType = "experienced" | "student";

const langNames: Record<string, string> = {
  fr: "français",
  en: "anglais",
  ar: "arabe",
  de: "allemand",
  it: "italien",
};

// Helper pour nettoyer et formater les textes générés
function cleanAiText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/^["'«»“]|["'«»”]$/g, "")
    .replace(/^>+\s*/gm, "") // Retire les blockquotes markdown
    .replace(/\*\*(.*?)\*\*/g, "$1") // Nettoie le gras superflu
    .replace(/```(?:json|markdown)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Appel rapide à Gemini avec timeout réaliste de 12000ms
async function fetchGeminiWithTimeout(prompt: string, systemInstruction?: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("cv_tounsi_client_token") : null;
    if (token) {
      headers["x-activation-token"] = token;
    }
  } catch {
    // ignore
  }

  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, systemInstruction }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Limite d'améliorations IA atteinte (5 par heure).");
      }
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.error || !data.text) throw new Error(data.error || "No text");
    return cleanAiText(data.text);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* ── 1. Étape 1 : Amélioration de l'Accroche / Profil ── */
export async function improveProfileWithGemini({
  language,
  targetRole,
  currentSummary,
  profileType = "experienced",
}: {
  language: string;
  targetRole: string;
  currentSummary?: string;
  profileType?: ProfileType;
}): Promise<string> {
  const rawSummary = (currentSummary || "").trim();
  const rawRole = (targetRole || "").trim();
  const isStudent = profileType === "student";

  // Déterminer le domaine réel saisi par le candidat
  let domain = rawSummary.length > 0 && rawSummary.length < 80 
    ? rawSummary 
    : (rawRole || (isStudent ? "Étudiant / Futur Diplômé" : "Professionnel"));

  const systemInstruction = isStudent
    ? `Tu es un coach carrière expert pour étudiants et débutants. Rédige UNIQUEMENT un paragraphe d'accroche de 2 à 3 phrases percutantes en ${langNames[language] || "français"} pour un profil étudiant / débutant dans le domaine "${domain}". Valorise la formation, la curiosité, l'adaptabilité et la motivation. Interdiction de mettre des titres, des puces, des guillemets ou des alternatives. Réponds UNIQUEMENT avec le texte final du CV.`
    : `Tu es un expert RH de direction. Rédige UNIQUEMENT un paragraphe d'accroche professionnelle de 2 à 3 phrases percutantes en ${langNames[language] || "français"} pour un profil dans le domaine/poste "${domain}". Valorise l'expertise, les résultats, la rigueur et la valeur ajoutée métier. Interdiction de mettre des titres, des puces, des guillemets ou des alternatives. Réponds UNIQUEMENT avec le texte final du CV.`;

  const userPrompt = rawSummary.length > 0
    ? `Rédige l'accroche de CV pour ce profil : "${rawSummary}". Intitulé ou domaine : "${domain}".`
    : `Rédige l'accroche de CV pour un profil ciblant le domaine : "${domain}".`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 25) return res;
  } catch (err) {
    console.warn("[Gemini Client] Utilisation du moteur sémantique local de secours:", err);
  }

  // Fallback dynamique
  const role = domain || "votre spécialité";
  if (isStudent) {
    return `Étudiant(e) motivé(e) et rigoureux(se) dans le domaine de ${role}, doté(e) d'une solide formation académique et d'un vif esprit d'analyse. Passionné(e) par les projets innovants et les nouvelles technologies, je fais preuve d'une grande adaptabilité et d'un sens aigu du travail en équipe. En recherche active d'une opportunité (stage / premier emploi) pour mettre mon dynamisme et mes compétences au service de vos objectifs.`;
  }
  return `Professionnel(le) passionné(e) et rigoureux(se) spécialisé(e) en ${role}, combinant une solide maîtrise technique et une vision stratégique orientée résultats. Fort(e) d'une capacité démontrée à piloter des projets complexes avec agilité et à fédérer les équipes autour d'objectifs ambitieux. Reconnu(e) pour mon autonomie, ma réactivité et mon engagement continu vers l'excellence opérationnelle.`;
}

/* ── 2. Étape 2 : Amélioration des Expériences / Projets Professionnels ── */
export async function improveExperienceWithGemini({
  language,
  targetRole,
  role,
  company,
  description,
  profileType = "experienced",
}: {
  language: string;
  targetRole: string;
  role: string;
  company: string;
  description: string;
  profileType?: ProfileType;
}): Promise<string> {
  const isStudent = profileType === "student";
  const userRole = role || targetRole || (isStudent ? "Projet Académique / Stage" : "Poste Professionnel");
  const userCompany = company || (isStudent ? "Université / Organisme" : "Entreprise");
  const userDesc = (description || "").trim();

  const systemInstruction = isStudent
    ? `Tu es un spécialiste de l'insertion professionnelle des étudiants. Rédige UNIQUEMENT 3 à 4 puces concises d'impact en ${langNames[language] || "français"} pour un projet académique ou stage. Chaque puce commence obligatoirement par •. Met en valeur les technologies, la méthodologie et les livrables. Aucun titre, aucun autre texte.`
    : `Tu es un spécialiste RH et recrutement ATS. Rédige UNIQUEMENT 3 à 4 puces professionnelles d'impact chiffrées et concrètes en ${langNames[language] || "français"}. Chaque puce commence obligatoirement par •. Aucun titre, aucun autre texte.`;

  const userPrompt = userDesc && userDesc.length > 5
    ? `Poste : "${userRole}" chez "${userCompany}". Détails / Notes fournies : \n${userDesc}\nRédige 3 à 4 puces professionnelles commençant par •.`
    : `Poste : "${userRole}" chez "${userCompany}". Propose 3 à 4 réalisations et missions clés concrètes pour ce poste, commençant chacune par •.`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 20) {
      const lines = res.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      return lines.map((l) => (l.startsWith("•") ? l : `• ${l.replace(/^[-*–—]\s*/, "")}`)).join("\n");
    }
  } catch (err) {
    console.warn("[Gemini Client] Fallback expérience:", err);
  }

  const rawLines = userDesc
    .split("\n")
    .map((l) => l.trim().replace(/^[-*–—•]\s*/, ""))
    .filter(Boolean);

  if (rawLines.length >= 2) {
    return rawLines
      .map((line) => `• ${line.charAt(0).toUpperCase() + line.slice(1)}`)
      .join("\n");
  }

  if (isStudent) {
    return [
      `• Conception, développement et soutenance du projet dans le cadre de ${userCompany}.`,
      `• Application des méthodologies modernes et maîtrise des outils techniques requis pour ${userRole}.`,
      `• Travail en équipe collaborative, respect des délais et présentation des livrables finaux.`,
    ].join("\n");
  }

  return [
    `• Pilotage et réalisation des objectifs clés au poste de ${userRole} chez ${userCompany}.`,
    `• Coordination active avec les équipes et optimisation des processus opérationnels.`,
    `• Suivi rigoureux des indicateurs de performance (KPIs) et amélioration continue de la qualité.`,
    `• Déploiement des meilleures pratiques sectorielles pour maximiser les résultats.`,
  ].join("\n");
}

/* ── 3. Étape 3 : Suggestion de Compétences Clés ── */
export async function improveSkillsWithGemini({
  language,
  targetRole,
  currentSkills,
  profileType = "experienced",
}: {
  language: string;
  targetRole: string;
  currentSkills?: string;
  profileType?: ProfileType;
}): Promise<string> {
  const isStudent = profileType === "student";
  const userSkills = (currentSkills || "").trim();
  const domain = targetRole || (userSkills.length > 0 && userSkills.length < 60 ? userSkills : (isStudent ? "Étudiant / Débutant" : "Professionnel"));

  const systemInstruction = `Tu es un recruteur expert en recrutement. Donne UNIQUEMENT une liste de 8 à 10 compétences clés (hard skills, logiciels, méthodologies, soft skills) adaptées au domaine "${domain}" en ${langNames[language] || "français"}, séparées par des points médians · . Aucun titre, aucun guillemet, aucun autre texte.`;

  const userPrompt = userSkills && userSkills.length > 3
    ? `Domaine / Métier : "${domain}". Compétences actuelles : "${userSkills}". Propose 8 à 10 compétences clés pertinentes et modernes séparées par · .`
    : `Domaine / Métier visé : "${domain}". Propose 8 à 10 compétences clés incontournables séparées par · .`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 15) {
      return res
        .replace(/\n+/g, " · ")
        .replace(/^[-*•]\s*/gm, "")
        .replace(/\s*·\s*/g, " · ")
        .trim();
    }
  } catch (err) {
    console.warn("[Gemini Client] Fallback compétences:", err);
  }

  if (isStudent) {
    return `Capacité d'apprentissage rapide · Travail en équipe & Agilité · Pack Office & Outils collaboratifs · Résolution de problèmes · Rigueur & Sens du détail · Communication écrite & orale · Gestion du temps · Esprit d'initiative`;
  }

  return `Gestion de projet · Analyse stratégique & Résolution de problèmes · Outils métiers spécialisés · Travail en équipe & Leadership · Communication professionnelle · Rigueur & Autonomie · Optimisation des processus`;
}

/* ── 4. Étape 3 : Suggestion et Formatage des Langues ── */
export async function improveLanguagesWithGemini({
  language,
  targetRole,
  currentLanguages,
  profileType = "experienced",
}: {
  language: string;
  targetRole: string;
  currentLanguages?: string;
  profileType?: ProfileType;
}): Promise<string> {
  const userLangs = (currentLanguages || "").trim();
  const langTarget = langNames[language] || "français";

  const systemInstruction = `Tu es un spécialiste RH. Rédige UNIQUEMENT une liste de 3 à 4 langues professionnelles avec niveaux de maîtrise normalisés (ex: Maternelle, Bilingue / C2, Courant / C1, Intermédiaire / B2) rédigées en ${langTarget}, séparées par des points médians · . Aucun titre, aucune puce, aucun autre texte.`;

  const userPrompt = userLangs && userLangs.length > 2
    ? `Formate et optimise ces langues pour un CV professionnel : "${userLangs}". Langue du CV : ${langTarget}.`
    : `Donne les 3 ou 4 langues professionnelles courantes pour un profil ${profileType === "student" ? "étudiant / jeune diplômé" : "professionnel"} (Arabe, Français, Anglais, etc.) avec leurs niveaux respectifs en ${langTarget}.`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 10) {
      return res
        .replace(/\n+/g, " · ")
        .replace(/^[-*•]\s*/gm, "")
        .replace(/\s*·\s*/g, " · ")
        .trim();
    }
  } catch (err) {
    console.warn("[Gemini Client] Fallback langues:", err);
  }

  return "Arabe (Langue maternelle) · Français (Bilingue / C2) · Anglais (Courant / C1) · Allemand (Notions / B1)";
}

/* ── 5. Harmonisation Globale du CV ── */
export async function improveFullCvWithGemini({
  language,
  targetRole,
  experienceRole,
  company,
  experienceText,
  profileType = "experienced",
}: {
  language: string;
  targetRole: string;
  experienceRole: string;
  company: string;
  experienceText: string;
  profileType?: ProfileType;
}): Promise<{
  summary: string;
  experienceBullets: string[];
  skills: string;
}> {
  const [summary, expText, skills] = await Promise.all([
    improveProfileWithGemini({ language, targetRole, currentSummary: targetRole, profileType }),
    improveExperienceWithGemini({ language, targetRole, role: experienceRole, company, description: experienceText, profileType }),
    improveSkillsWithGemini({ language, targetRole, currentSkills: "", profileType }),
  ]);

  const experienceBullets = expText.split("\n").map((s) => s.trim()).filter(Boolean);

  return {
    summary,
    experienceBullets,
    skills,
  };
}
