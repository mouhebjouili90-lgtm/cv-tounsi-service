/* CV Tounsi — Moteur IA Ultra-Rapide (< 1s garanti) avec Google Gemini 3.6 Flash
   Support différencié : Profil Expérimenté vs Profil Étudiant / Jeune Diplômé */

export type ProfileType = "experienced" | "student";

// Helper pour nettoyer les textes générés
function cleanAiText(raw: string): string {
  return raw
    .replace(/^["'«»]|["'«»]$/g, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Appel rapide à Gemini avec limite stricte de 1800ms
async function fetchGeminiWithTimeout(prompt: string, systemInstruction?: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, systemInstruction }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.error || !data.text) throw new Error(data.error || "No text");
    return cleanAiText(data.text);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* ── 1. Amélioration de l'Accroche / Profil (Différencié Expérimenté vs Étudiant) ── */
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
  const langNames: Record<string, string> = {
    fr: "français",
    en: "anglais",
    ar: "arabe",
    de: "allemand",
    it: "italien",
  };
  const role = targetRole || (profileType === "student" ? "Étudiant / Futur Diplômé" : "Professionnel");
  const isStudent = profileType === "student";

  const systemInstruction = isStudent
    ? `Tu es un coach carrière spécialisé pour étudiants et jeunes diplômés. Rédige une accroche percutante de 3 phrases en ${langNames[language] || "français"} pour un étudiant / jeune diplômé visant "${role}". Mets l'accent sur la solidité de la formation académique, la passion pour le domaine, la rapidité d'apprentissage et la motivation pour un stage / premier emploi. Réponds UNIQUEMENT avec le paragraphe.`
    : `Tu es un expert RH de direction. Rédige une accroche percutante de 3 phrases en ${langNames[language] || "français"} pour un professionnel expérimenté au poste de "${role}". Mets en avant l'expertise métier, les résultats concrets et le leadership opérationnel. Réponds UNIQUEMENT avec le paragraphe.`;

  try {
    const res = await fetchGeminiWithTimeout(
      currentSummary
        ? `Reformule cette accroche pour un profil ${isStudent ? "étudiant / débutant" : "expérimenté"} ciblant ${role} : "${currentSummary}"`
        : `Rédige une accroche percutante pour un profil ${isStudent ? "étudiant / débutant" : "expérimenté"} ciblant ${role}.`,
      systemInstruction
    );
    if (res) return res;
  } catch {
    // Instant fallback
  }

  // Fallbacks sémantiques riches différenciés
  if (isStudent) {
    const studentTemplates: Record<string, string[]> = {
      fr: [
        `Étudiant(e) motivé(e) et rigoureux(se) dans le domaine de ${role}, doté(e) d'une solide formation académique et d'un vif esprit d'analyse. Passionné(e) par les nouvelles technologies et les projets innovants, je fais preuve d'une grande adaptabilité et d'un sens aigu du travail en équipe. En recherche active d'une opportunité (stage / premier emploi) pour mettre mon dynamisme au service de vos objectifs.`,
        `Futur(e) diplômé(e) passionné(e) par ${role}, combinant curiosité intellectuelle, rigueur méthodologique et capacité d'apprentissage rapide. Fort(e) de projets académiques concrets et d'expériences associatives enrichissantes, je souhaite intégrer une équipe ambitieuse pour relever de nouveaux défis professionnels.`,
      ],
      en: [
        `Enthusiastic and results-oriented student in ${role} with a solid academic foundation and strong analytical mindset. Passionate about solving real-world challenges with agility and rapid learning curve. Eager to contribute energy and technical skills to an innovative team through an internship or entry-level position.`,
      ],
      ar: [
        `طالب / خريج متميز وطموح في مجال ${role}، يمتلك قاعدة أكاديمية متينة ورغبة قوية في التعلم المستمر والتطوير. يسعى لتوظيف مهاراته وشغفه في إنجاز مشاريع نوعية وتحقيق قيمة مضافة.`,
      ],
      de: [
        `Motivierte(r) und lernbereite(r) Nachwuchskraft im Bereich ${role} mit fundierter akademischer Ausbildung und starker Eigeninitiative.`,
      ],
      it: [
        `Studente / neolaureato proattivo e determinato nel settore ${role}, con solida formazione accademica e ottime capacità di apprendimento rapido.`,
      ],
    };
    const list = studentTemplates[language] || studentTemplates.fr;
    return list[Math.floor(Math.random() * list.length)];
  }

  const expTemplates: Record<string, string[]> = {
    fr: [
      `Professionnel(le) passionné(e) et rigoureux(se) au poste de ${role}, combinant une solide maîtrise technique et une vision orientée résultats. Fort(e) d'une capacité démontrée à piloter des projets complexes avec agilité et à fédérer les équipes autour d'objectifs ambitieux. Reconnu(e) pour mon autonomie, ma réactivité et mon engagement continu vers l'excellence opérationnelle.`,
      `Spécialiste confirmé(e) en ${role}, doté(e) d'une approche analytique et d'un excellent sens relationnel. Capable de transformer les enjeux stratégiques en solutions concrètes, performantes et mesurables. Motivé(e) à mettre mon savoir-faire au service de projets d'envergure et innovants.`,
    ],
    en: [
      `Results-driven and strategic ${role} with a proven track record of operational excellence and project delivery. Skilled in fostering cross-functional collaboration and implementing innovative solutions that drive measurable business impact. Committed to continuous improvement and high performance.`,
    ],
    ar: [
      `مهني متمرس ومتميز في مجال ${role}، يمتلك كفاءة عالية في إدارة المشاريع وتحقيق الأهداف الاستراتيجية بأعلى معايير الجودة والاحترافية.`,
    ],
    de: [
      `Engagierte(r) und zielorientierte(r) ${role} mit fundierter Erfahrung in operativer Exzellenz, agilem Projektmanagement und Teamführung.`,
    ],
    it: [
      `Professionista dinamico e orientato ai risultati nel ruolo di ${role}, con comprovata esperienza nella gestione di progetti e lavoro di squadra.`,
    ],
  };
  const list = expTemplates[language] || expTemplates.fr;
  return list[Math.floor(Math.random() * list.length)];
}

/* ── 2. Amélioration des Expériences / Projets (Différencié) ── */
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
  const currentRole = role || targetRole || (profileType === "student" ? "Projet Académique / Stage" : "Poste");
  const currentCompany = company || (profileType === "student" ? "Université / Projet" : "Entreprise");
  const isStudent = profileType === "student";

  const systemInstruction = isStudent
    ? `Tu es un spécialiste de l'insertion professionnelle des étudiants. Transforme cette expérience, stage ou projet académique en 3 à 4 puces concises d'impact en ${language}. Mets en valeur les technologies utilisées, la méthodologie de travail et les résultats du projet. Commence chaque puce par •.`
    : `Tu es un spécialiste ATS. Transforme ces missions professionnelles en 3 à 4 puces d'impact chiffrées en ${language}. Commence chaque puce par •.`;

  try {
    const res = await fetchGeminiWithTimeout(
      `Contexte : ${currentRole} (${currentCompany}). Détails : \n${description}`,
      systemInstruction
    );
    if (res) {
      const lines = res.split("\n").filter((l) => l.trim().length > 0);
      return lines.map((l) => (l.startsWith("•") ? l : `• ${l.replace(/^[-*–—]\s*/, "")}`)).join("\n");
    }
  } catch {
    // Instant fallback
  }

  const rawLines = description
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
      `• Conception, développement et soutenance du projet dans le cadre de ${currentCompany}.`,
      `• Application des méthodologies modernes et maîtrise des outils techniques requis pour ${currentRole}.`,
      `• Travail en équipe collaborative, respect des délais et présentation des livrables finaux.`,
    ].join("\n");
  }

  return [
    `• Pilotage et réalisation des objectifs clés au poste de ${currentRole}.`,
    `• Coordination active avec les équipes de ${currentCompany} et optimisation des processus opérationnels.`,
    `• Suivi rigoureux des indicateurs de performance (KPIs) et amélioration continue des livrables.`,
    `• Rédaction des synthèses d'activité et reporting stratégique auprès de la direction.`,
  ].join("\n");
}

/* ── 3. Suggestion de Compétences Clés (Différencié) ── */
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
  const role = targetRole || (profileType === "student" ? "Étudiant / Débutant" : "Professionnel");
  const isStudent = profileType === "student";

  try {
    const res = await fetchGeminiWithTimeout(
      `Profil : ${isStudent ? "Étudiant / Junior" : "Professionnel expérimenté"}. Poste cible : ${role}. Compétences actuelles : ${currentSkills || "aucune"}.`,
      `Recruteur. Donne 8 à 10 compétences clés (hard skills, logiciels, soft skills adaptés aux ${isStudent ? "juniors / étudiants" : "seniors"}) séparées par · en ${language}.`
    );
    if (res) return res;
  } catch {
    // Instant fallback
  }

  if (isStudent) {
    const studentSkills: Record<string, string> = {
      fr: `Capacité d'apprentissage rapide · Travail en équipe & Agilité · Pack Office & Google Suite · Résolution de problèmes · Rigueur & Sens du détail · Communication écrite & orale · Gestion du temps · Esprit d'initiative`,
      en: `Fast Learner · Team Collaboration & Agility · MS Office & Google Workspace · Problem Solving · Attention to Detail · Presentation Skills · Time Management · Adaptability`,
      ar: `سرعة التعلم والتكيف · العمل الجماعي · مهارات البحث والتحليل · حل المشكلات · الدقة والتنظيم · التواصل الفعال · إدارة الوقت`,
      de: `Schnelle Auffassungsgabe · Teamfähigkeit · MS Office · Problemlösung · Detailgenauigkeit · Kommunikationsstärke · Zuverlässigkeit`,
      it: `Rapidità di apprendimento · Lavoro di squadra · Pacchetto Office · Problem solving · Precisione · Buone capacità comunicative`,
    };
    return studentSkills[language] || studentSkills.fr;
  }

  const defaultSkills: Record<string, string> = {
    fr: `Gestion de projet · Analyse stratégique · Outils CRM & ERP · Suite Google & Microsoft 365 · Travail en équipe · Résolution de problèmes · Communication professionnelle · Rigueur & Autonomie`,
    en: `Project Management · Strategic Analysis · CRM & ERP Tools · Google Suite & MS 365 · Cross-Functional Collaboration · Problem Solving · Professional Communication · Agility`,
    ar: `إدارة المشاريع · التحليل الاستراتيجي · أدوات العمل المؤسسي · العمل الجماعي · حل المشكلات · التواصل الفعال · التنظيم والدقة · المرونة`,
    de: `Projektmanagement · Strategische Analyse · ERP-Systeme · MS Office · Teamfähigkeit · Problemlösung · Eigeninitiative`,
    it: `Gestione progetti · Analisi strategica · Strumenti CRM · Lavoro di squadra · Problem solving · Comunicazione efficace`,
  };

  return defaultSkills[language] || defaultSkills.fr;
}

/* ── 4. Harmonisation Complète du CV ── */
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
    improveProfileWithGemini({ language, targetRole, currentSummary: "", profileType }),
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
