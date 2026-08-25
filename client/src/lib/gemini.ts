/* CV Tounsi — Moteur IA Ultra-Performant avec Google Gemini 3.6 Flash
   Génération sur-mesure & dynamique selon le profil de chaque candidat */

export type ProfileType = "experienced" | "student";

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

// Appel rapide à Gemini avec limite réaliste de 12000ms
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

/* ── 1. Amélioration de l'Accroche / Profil (Sur-mesure selon le mot-clé ou poste réel) ── */
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

  const rawSummary = (currentSummary || "").trim();
  const rawRole = (targetRole || "").trim();
  const isStudent = profileType === "student";

  // Déterminer le domaine réel saisi par le candidat
  let domain = rawSummary.length > 0 && rawSummary.length < 80 
    ? rawSummary 
    : (rawRole || (isStudent ? "Étudiant / Futur Diplômé" : "Professionnel"));

  const systemInstruction = isStudent
    ? `Tu es un coach carrière expert pour étudiants et débutants. Rédige UNIQUEMENT un paragraphe d'accroche de 2 à 3 phrases percutantes en ${langNames[language] || "français"} pour un étudiant / jeune diplômé dans le domaine "${domain}". Valorise la formation, la curiosité, l'adaptabilité et la motivation. Interdiction de mettre des titres, des puces, des guillemets ou des alternatives. Réponds UNIQUEMENT avec le texte final du CV.`
    : `Tu es un expert RH de direction. Rédige UNIQUEMENT un paragraphe d'accroche professionnelle de 2 à 3 phrases percutantes en ${langNames[language] || "français"} pour un profil dans le domaine/poste "${domain}". Valorise l'expertise, les résultats, la rigueur et la valeur ajoutée métier. Interdiction de mettre des titres, des puces, des guillemets ou des alternatives. Réponds UNIQUEMENT avec le texte final du CV.`;

  const userPrompt = rawSummary.length > 0
    ? `Rédige l'accroche de CV pour ce profil : "${rawSummary}". Intitulé ou domaine : "${domain}".`
    : `Rédige l'accroche de CV pour un professionnel ciblant le domaine : "${domain}".`;

  try {
    const res = await fetchGeminiWithTimeout(userPrompt, systemInstruction);
    if (res && res.length > 25) return res;
  } catch (err) {
    console.warn("[Gemini Client] Utilisation du moteur sémantique local de secours:", err);
  }

  // Fallback sémantique dynamique personnalisé selon le mot-clé exact saisi
  const role = domain || "votre spécialité";

  if (isStudent) {
    const studentTemplates: Record<string, string[]> = {
      fr: [
        `Étudiant(e) motivé(e) et rigoureux(se) dans le domaine de ${role}, doté(e) d'une solide formation académique et d'un vif esprit d'analyse. Passionné(e) par les projets innovants et les nouvelles technologies, je fais preuve d'une grande adaptabilité et d'un sens aigu du travail en équipe. En recherche active d'une opportunité (stage / premier emploi) pour mettre mon dynamisme et mes compétences au service de vos objectifs.`,
        `Futur(e) diplômé(e) passionné(e) par ${role}, combinant curiosité intellectuelle, rigueur méthodologique et capacité d'apprentissage rapide. Fort(e) de projets académiques concrets et d'un engagement fort, je souhaite intégrer une équipe ambitieuse pour relever de nouveaux défis professionnels.`,
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
      `Professionnel(le) passionné(e) et rigoureux(se) spécialisé(e) en ${role}, combinant une solide maîtrise technique et une vision stratégique orientée résultats. Fort(e) d'une capacité démontrée à piloter des projets complexes avec agilité et à fédérer les équipes autour d'objectifs ambitieux. Reconnu(e) pour mon autonomie, ma réactivité et mon engagement continu vers l'excellence opérationnelle.`,
      `Spécialiste confirmé(e) en ${role}, doté(e) d'une approche analytique et d'un excellent sens relationnel. Capable d'anticiper les défis majeurs et de concevoir des solutions performantes, sécurisées et mesurables. Motivé(e) à mettre mon savoir-faire au service de projets d'envergure.`,
    ],
    en: [
      `Results-driven and strategic ${role} specialist with a proven track record of operational excellence and project delivery. Skilled in fostering cross-functional collaboration and implementing innovative solutions that drive measurable business impact. Committed to continuous improvement and high performance.`,
    ],
    ar: [
      `مهني متمرس ومتميز في مجال ${role}، يمتلك كفاءة عالية في إدارة المشاريع وتحقيق الأهداف الاستراتيجية بأعلى معايير الجودة والاحترافية.`,
    ],
    de: [
      `Engagierte(r) und zielorientierte(r) ${role} Spezialist mit fundierter Erfahrung in operativer Exzellenz, agilem Projektmanagement und Teamführung.`,
    ],
    it: [
      `Professionista dinamico e orientato ai risultati nel ruolo di ${role}, con comprovata esperienza nella gestione di progetti e lavoro di squadra.`,
    ],
  };
  const list = expTemplates[language] || expTemplates.fr;
  return list[Math.floor(Math.random() * list.length)];
}

/* ── 2. Amélioration des Expériences / Projets ── */
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
    ? `Tu es un spécialiste de l'insertion professionnelle des étudiants. Transforme cette expérience, stage ou projet académique en 3 à 4 puces concises d'impact en ${language}. Mets en valeur les technologies utilisées, la méthodologie de travail et les résultats du projet. Commence chaque puce par •. Ne mets rien d'autre.`
    : `Tu es un spécialiste ATS et recrutement. Transforme ces missions professionnelles en 3 à 4 puces d'impact chiffrées en ${language}. Commence chaque puce par •. Ne mets rien d'autre.`;

  try {
    const res = await fetchGeminiWithTimeout(
      `Contexte : ${currentRole} (${currentCompany}). Détails : \n${description}`,
      systemInstruction
    );
    if (res) {
      const lines = res.split("\n").filter((l) => l.trim().length > 0);
      return lines.map((l) => (l.startsWith("•") ? l : `• ${l.replace(/^[-*–—]\s*/, "")}`)).join("\n");
    }
  } catch (err) {
    console.warn("[Gemini Client] Fallback expérience:", err);
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

/* ── 3. Suggestion de Compétences Clés ── */
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
      `Profil : ${isStudent ? "Étudiant / Junior" : "Professionnel expérimenté"}. Poste ou domaine cible : ${role}. Compétences actuelles : ${currentSkills || "aucune"}.`,
      `Recruteur. Donne 8 à 10 compétences clés (hard skills, logiciels, soft skills adaptés aux ${isStudent ? "juniors / étudiants" : "seniors"}) séparées par · en ${language}. Réponds UNIQUEMENT avec la liste des compétences.`
    );
    if (res) return res;
  } catch (err) {
    console.warn("[Gemini Client] Fallback compétences:", err);
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
