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
  const lang = language || "fr";

  let domain = rawSummary.length > 0 && rawSummary.length < 80 
    ? rawSummary 
    : (rawRole || (isStudent ? "Étudiant / Débutant" : "Professionnel"));

  const targetLangLabel = langNames[lang] || "français";

  const systemInstruction = isStudent
    ? `Tu es un expert RH et coach carrière. Rédige UNIQUEMENT un paragraphe d'accroche fluide de 2 à 3 phrases percutantes en ${targetLangLabel} pour un profil étudiant ou débutant dans le domaine "${domain}". Met en valeur l'enthousiasme, la rigueur, les bases académiques et le potentiel. Aucun titre, aucun guillemet, aucun préfixe. Rends UNIQUEMENT le texte final.`
    : `Tu es un expert en recrutement international. Rédige UNIQUEMENT un paragraphe d'accroche professionnelle de 2 à 3 phrases percutantes en ${targetLangLabel} pour un profil dans le domaine "${domain}". Met en valeur la compétence métier, les résultats et la valeur ajoutée. Aucun titre, aucun guillemet, aucun préfixe. Rends UNIQUEMENT le texte final.`;

  const userPrompt = rawSummary.length > 0
    ? `Améliore et professionnalise cette accroche de CV en ${targetLangLabel} pour le poste/domaine "${domain}" : "${rawSummary}". Réponds uniquement avec le texte final en ${targetLangLabel}.`
    : `Rédige une accroche professionnelle percutante en ${targetLangLabel} pour un candidat visant le poste ou domaine "${domain}".`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 25) return res;
  } catch (err) {
    console.warn("[Gemini Client] Utilisation du moteur sémantique local de secours:", err);
  }

  // Fallbacks multilingues de haute qualité
  const role = domain || (lang === "ar" ? "المجال المهني" : lang === "en" ? "your field" : "votre spécialité");
  if (lang === "ar") {
    if (isStudent) {
      return `طالب متميز وشغوف في مجال ${role}، يمتلك قاعدة أكاديمية متينة ورغبة صادقة في التطور والتعلم السريع. أتميز بالانضباط وروح المبادرة والقدرة على الاندماج في فرق العمل. أبحث عن فرصة تدريبية أو أول تجربة مهنية لتطبيق مهاراتي وتقديم قيمة مضافة حقيقية لمؤسستكم.`;
    }
    return `محترف متمرس ومسؤول في مجال ${role}، أجمع بين التمكن العملي والرؤية الموجهة نحو تحقيق النتائج الملموسة. أتمتع بخبرة مؤكدة في إدارة المهام بكفاءة والتنسيق مع فرق العمل لتحقيق الأهداف. معروف بدقة الأداء والاستقلالية والحرص المستمر على التميز والجودة.`;
  }

  if (lang === "en") {
    if (isStudent) {
      return `Motivated and ambitious student in ${role}, equipped with a solid academic foundation and strong analytical skills. Eager to contribute fresh perspectives, learn quickly, and collaborate within a dynamic team. Actively seeking an internship or entry-level opportunity to deliver immediate value.`;
    }
    return `Dedicated and results-driven professional specialized in ${role}, with a proven track record of optimizing workflows and delivering measurable outcomes. Known for problem-solving agility, cross-functional collaboration, and an unwavering commitment to operational excellence.`;
  }

  // Français (défaut)
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
  const lang = language || "fr";
  const userRole = role || targetRole || (lang === "ar" ? "المنصب المهني" : lang === "en" ? "Professional Role" : "Poste Professionnel");
  const userCompany = company || (lang === "ar" ? "المؤسسة / الشركة" : lang === "en" ? "Company / Organization" : "Entreprise");
  const userDesc = (description || "").trim();
  const targetLangLabel = langNames[lang] || "français";

  const systemInstruction = isStudent
    ? `Tu es un spécialiste de l'insertion professionnelle des étudiants. Rédige UNIQUEMENT 3 à 4 puces concises d'impact en ${targetLangLabel} pour un projet académique ou stage. Chaque puce commence obligatoirement par •. Met en valeur les technologies, la méthodologie et les livrables. Aucun titre, aucun autre texte.`
    : `Tu es un spécialiste RH et recrutement ATS. Rédige UNIQUEMENT 3 à 4 puces professionnelles d'impact en ${targetLangLabel} (réalisations concrètes, missions clés, méthode). Chaque puce commence obligatoirement par •. Aucun titre, aucun autre texte.`;

  const userPrompt = userDesc && userDesc.length > 5
    ? `Poste : "${userRole}" chez "${userCompany}". Détails fournis : \n${userDesc}\nRédige 3 à 4 puces professionnelles en ${targetLangLabel} commençant chacune par •.`
    : `Poste : "${userRole}" chez "${userCompany}". Propose 3 à 4 réalisations et missions clés concrètes pour ce poste en ${targetLangLabel}, commençant chacune par •.`;

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

  if (lang === "ar") {
    if (isStudent) {
      return [
        `• تخطيط وتنفيذ المشروع الأكاديمي بنجاح في إطار ${userCompany}.`,
        `• تطبيق أحدث التقنيات والمنهجيات العلمية المكتسبة لتحقيق المتطلبات المحددة.`,
        `• العمل ضمن فريق جماعي، الالتزام بالآجال المحددة وتقديم العروض والمخرجات بجودة عالية.`,
      ].join("\n");
    }
    return [
      `• إدارة وتنسيق المهام والمشاريع الموكلة لمنصب ${userRole} لدى ${userCompany}.`,
      `• تحسين أساليب العمل ورفع الكفاءة التشغيلية لضمان تحقيق المستهدفات بدقة.`,
      `• متابعة مؤشرات الأداء وتطبيق أفضل الممارسات المعتمدة في المجال.`,
      `• التواصل المستمر مع مختلف الأقسام لضمان سلاسة سير العمل ورضا العملاء.`,
    ].join("\n");
  }

  if (lang === "en") {
    if (isStudent) {
      return [
        `• Successfully designed and implemented core project requirements at ${userCompany}.`,
        `• Applied modern methodologies and technical tools relevant to ${userRole}.`,
        `• Collaborated effectively within a multidisciplinary team and delivered milestones on schedule.`,
      ].join("\n");
    }
    return [
      `• Led key operations and executed critical responsibilities as ${userRole} at ${userCompany}.`,
      `• Streamlined internal workflows and implemented best practices to enhance overall team productivity.`,
      `• Monitored KPIs and ensured high standards of quality and timely project completion.`,
      `• Collaborated cross-functionally with stakeholders to align deliverables with organizational objectives.`,
    ].join("\n");
  }

  // Français (défaut)
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
  const role = (targetRole || "").trim() || "Général";
  const userSkills = (currentSkills || "").trim();
  const lang = language || "fr";
  const targetLangLabel = langNames[lang] || "français";

  const systemInstruction = `Tu es un recruteur expert. Propose une liste de 6 à 8 compétences incontournables (techniques et humaines) en ${targetLangLabel} pour le poste ou domaine "${role}". Les compétences doivent être séparées obligatoirement par des virgules (,). Aucun titre, aucun numéro, aucun point de puce. Réponds UNIQUEMENT par la liste des compétences séparées par des virgules.`;

  const userPrompt = userSkills && userSkills.length > 3
    ? `Poste : "${role}". Compétences actuelles : "${userSkills}". Complète et sélectionne les 6 à 8 meilleures compétences en ${targetLangLabel} séparées par des virgules.`
    : `Poste ciblé : "${role}". Propose les 6 à 8 meilleures compétences professionnelles en ${targetLangLabel} séparées par des virgules.`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 10) {
      return res
        .replace(/^[•\-\*\d\.\s]+/gm, "")
        .replace(/\n+/g, ", ")
        .replace(/,\s*,/g, ",")
        .trim();
    }
  } catch (err) {
    console.warn("[Gemini Client] Fallback compétences:", err);
  }

  if (lang === "ar") {
    return "إدارة المشاريع, التخطيط الاستراتيجي, حل المشكلات, العمل الجماعي, التواصل الفعال, إدارة الوقت, تحليل البيانات, المرونة والتكيف";
  }
  if (lang === "en") {
    return "Project Management, Strategic Planning, Problem Solving, Cross-Functional Collaboration, Communication, Time Management, Data Analysis, Adaptability";
  }
  return "Gestion de projet, Rigueur & Organisation, Travail en équipe, Résolution de problèmes, Communication professionnelle, Esprit d'analyse, Gestion du temps, Adaptabilité";
}

/* ── 4. Étape 4 : Normalisation des Langues ── */
export async function improveLanguagesWithGemini({
  language,
  currentLanguages,
}: {
  language: string;
  currentLanguages?: string;
}): Promise<string> {
  const userLangs = (currentLanguages || "").trim();
  const lang = language || "fr";
  const targetLangLabel = langNames[lang] || "français";

  const systemInstruction = `Tu es un expert RH. Normalise la liste des langues du candidat pour un CV en ${targetLangLabel} avec des niveaux standardisés (ex: Maternelle / Courant / Intermédiaire). Sépare chaque langue par " · ". Rends UNIQUEMENT la ligne finale sans aucun autre texte.`;
  const userPrompt = userLangs && userLangs.length > 2
    ? `Normalise ces langues pour un CV en ${targetLangLabel} : "${userLangs}".`
    : `Propose les 3 ou 4 langues courantes pour un professionnel tunisien pour un CV en ${targetLangLabel}.`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 10) return res.replace(/\n+/g, " · ").trim();
  } catch (err) {
    console.warn("[Gemini Client] Fallback langues:", err);
  }

  if (lang === "ar") {
    return "العربية (اللغة الأم) · الفرنسية (مستوى متقدم / C1) · الإنجليزية (مستوى مهني / B2)";
  }
  if (lang === "en") {
    return "Arabic (Native) · French (Fluent / C2) · English (Professional / C1) · German (Conversational / B1)";
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

/* ── 6. Traduction Intégrale Instantanée du CV (Arabe ⇄ Français ⇄ Anglais) ── */
export async function translateFullCvWithGemini({
  cvData,
  targetLanguage,
}: {
  cvData: any;
  targetLanguage: "ar" | "fr" | "en";
}): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("cv_tounsi_client_token") : null;
    if (token) {
      headers["x-activation-token"] = token;
    }
  } catch {
    // ignore
  }

  const response = await fetch("/api/ai/translate-cv", {
    method: "POST",
    headers,
    body: JSON.stringify({ cvData, targetLanguage }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Erreur de traduction (${response.status})`);
  }

  const data = await response.json();
  if (!data.translatedCv) {
    throw new Error("Traduction non reçue du serveur.");
  }
  return data.translatedCv;
}
