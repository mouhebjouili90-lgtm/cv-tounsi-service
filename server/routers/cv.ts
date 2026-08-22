/* CV Tounsi — Route serveur pour améliorer les textes à chaque étape avec Google Gemini API & support multi-modèles. */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { publicProcedure, router } from "../_core/trpc";
import { callGemini } from "../gemini";

const languageNames = {
  fr: "français",
  en: "anglais",
  de: "allemand",
  it: "italien",
  ar: "arabe",
} as const;

const templateNames = {
  professional: "CV Professionnel",
  canadian: "CV Canadien",
  europass: "CV Europass",
} as const;

/* ─── Schema: Global Copy Improvement ─── */
const improveInput = z.object({
  language: z.enum(["fr", "en", "de", "it", "ar"]),
  template: z.enum(["professional", "canadian", "europass"]),
  targetRole: z.string().trim().min(2).max(140),
  experienceRole: z.string().trim().min(2).max(140),
  company: z.string().trim().max(180),
  experienceText: z.string().trim().min(10).max(2400),
});

const improvementSchema = {
  name: "cv_copy_improvement",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "A concise professional summary in the requested language, maximum 420 characters.",
      },
      experienceBullets: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: {
          type: "string",
          description: "One clear, action-oriented experience bullet in the requested language.",
        },
      },
      keywords: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "string",
          description: "A relevant keyword already supported by the user's provided experience.",
        },
      },
    },
    required: ["summary", "experienceBullets", "keywords"],
    additionalProperties: false,
  },
} as const;

/* ─── Schema: Step 0 - Profile Summary Improvement ─── */
const improveProfileInput = z.object({
  language: z.enum(["fr", "en", "de", "it", "ar"]),
  targetRole: z.string().trim().min(2).max(140),
  currentSummary: z.string().trim().max(1500).optional(),
});

const profileSchema = {
  name: "cv_profile_improvement",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "An inspiring, high-impact 3-sentence professional summary for the target role.",
      },
    },
    required: ["summary"],
    additionalProperties: false,
  },
} as const;

/* ─── Schema: Step 1 - Single Experience Item Improvement ─── */
const improveExperienceInput = z.object({
  language: z.enum(["fr", "en", "de", "it", "ar"]),
  targetRole: z.string().trim().min(2).max(140),
  role: z.string().trim().min(2).max(140),
  company: z.string().trim().max(180),
  description: z.string().trim().min(5).max(2500),
});

const experienceSchema = {
  name: "cv_experience_improvement",
  strict: true,
  schema: {
    type: "object",
    properties: {
      bullets: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: {
          type: "string",
          description: "An action-driven bullet point highlighting quantifiable achievements.",
        },
      },
    },
    required: ["bullets"],
    additionalProperties: false,
  },
} as const;

/* ─── Schema: Step 2 - Skills Suggestions ─── */
const improveSkillsInput = z.object({
  language: z.enum(["fr", "en", "de", "it", "ar"]),
  targetRole: z.string().trim().min(2).max(140),
  currentSkills: z.string().trim().max(1000).optional(),
});

const skillsSchema = {
  name: "cv_skills_suggestion",
  strict: true,
  schema: {
    type: "object",
    properties: {
      skillsList: {
        type: "array",
        minItems: 6,
        maxItems: 12,
        items: {
          type: "string",
          description: "A high-demand skill or tool relevant to the target role.",
        },
      },
    },
    required: ["skillsList"],
    additionalProperties: false,
  },
} as const;

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((part): part is { type: "text"; text: string } => {
      return Boolean(
        part &&
          typeof part === "object" &&
          "type" in part &&
          part.type === "text" &&
          "text" in part &&
          typeof part.text === "string",
      );
    })
    .map((part) => part.text)
    .join("\n");
}

function parseJsonPayload(raw: string): any {
  const cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("AI response does not contain a JSON object");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function splitFacts(text: string): string[] {
  return text
    .split(/[.!?،؛,\n]+/)
    .map((part) => part.trim().replace(/^[-–—•]+\s*/, ""))
    .filter((part) => part.length >= 6);
}

export const cvRouter = router({
  /* ── 1. Global Copy Improvement ── */
  improveCopy: publicProcedure.input(improveInput).mutation(async ({ input }) => {
    const language = languageNames[input.language];
    const template = templateNames[input.template];

    // Priority 1: Google Gemini API (if key is set)
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        const rawContent = await callGemini({
          systemInstruction: `You are an expert ATS resume editor. Return valid JSON matching the schema. Write in ${language}. Improve clarity and impact for ${template}. Never invent fake metrics or employers.`,
          prompt: JSON.stringify({
            targetRole: input.targetRole,
            experienceRole: input.experienceRole,
            company: input.company,
            rawExperience: input.experienceText,
            task: "Create 1 punchy summary, 2 to 5 experience bullets, and 3 to 8 ATS keywords in JSON format.",
          }),
        });

        const parsed = parseJsonPayload(rawContent);
        const keywords = Array.isArray(parsed.keywords)
          ? parsed.keywords
          : parsed.keywords.split(/[;|,\n]+/).map((k: string) => k.trim()).filter(Boolean);

        return {
          summary: parsed.summary,
          experienceBullets: parsed.experienceBullets,
          keywords,
          model: "Google Gemini 2.5 Flash",
          language: input.language,
          template: input.template,
          usedFallback: false,
        };
      } catch (geminiErr) {
        console.warn("[CV] Gemini API call error, falling back:", geminiErr);
      }
    }

    // Priority 2: Built-in LLM Provider
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        messages: [
          {
            role: "system",
            content: `You are an expert ATS resume editor. Return valid JSON matching the schema. Write in ${language}. Improve clarity and impact for ${template}. Never invent fake metrics or employers.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole: input.targetRole,
              experienceRole: input.experienceRole,
              company: input.company,
              rawExperience: input.experienceText,
              task: "Create 1 punchy summary, 2 to 5 experience bullets, and 3 to 8 ATS keywords.",
            }),
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: improvementSchema,
        },
      });

      const rawContent = contentToText(result.choices[0]?.message?.content);
      if (!rawContent) throw new Error("Empty AI response");
      const parsed = parseJsonPayload(rawContent);
      const keywords = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : parsed.keywords.split(/[;|,\n]+/).map((k: string) => k.trim()).filter(Boolean);

      return {
        summary: parsed.summary,
        experienceBullets: parsed.experienceBullets,
        keywords,
        model: result.model || "gpt-5-mini",
        language: input.language,
        template: input.template,
        usedFallback: false,
      };
    } catch (error) {
      console.warn("[CV] LLM failed; using local fallback", error);
      const facts = splitFacts(input.experienceText);
      const bullets = facts.slice(0, 4);
      if (bullets.length < 2) {
        bullets.push(`${input.experienceRole} : Pilotage des activités et atteinte des objectifs.`);
      }

      return {
        summary: input.experienceText.length > 50
          ? `${input.targetRole} rigoureux(se) et orienté(e) résultats, justifiant d'une expérience probante chez ${input.company}.`
          : `Professionnel(le) qualifié(e) au poste de ${input.targetRole}, combinant rigueur opérationnelle et esprit d'initiative.`,
        experienceBullets: bullets.map((b) => b.startsWith("•") ? b : `• ${b}`),
        keywords: [input.targetRole, "Gestion de projet", "Communication", "Analyse de performance", "Autonomie"],
        model: "local-smart-fallback",
        language: input.language,
        template: input.template,
        usedFallback: true,
      };
    }
  }),

  /* ── 2. Step 0: Profile Hook Improvement ── */
  improveProfile: publicProcedure.input(improveProfileInput).mutation(async ({ input }) => {
    const language = languageNames[input.language];

    // Google Gemini Direct
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        const rawContent = await callGemini({
          systemInstruction: `You are an elite career coach. Write a compelling, punchy 3-sentence professional summary in ${language} for a candidate targeting the position of "${input.targetRole}". Highlight adaptability, strategic mindset, and value creation. Return valid JSON { "summary": "..." }.`,
          prompt: JSON.stringify({
            targetRole: input.targetRole,
            currentDraft: input.currentSummary || "",
          }),
        });

        const parsed = parseJsonPayload(rawContent);
        return {
          summary: parsed.summary,
          model: "Google Gemini 2.5 Flash",
        };
      } catch (err) {
        console.warn("[CV] Gemini profile call error, falling back:", err);
      }
    }

    // Built-in fallback
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        messages: [
          {
            role: "system",
            content: `You are an elite career coach. Write a compelling, punchy 3-sentence professional summary in ${language} for a candidate targeting the position of "${input.targetRole}". Highlight adaptability, strategic mindset, and value creation. Return valid JSON matching schema.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole: input.targetRole,
              currentDraft: input.currentSummary || "",
            }),
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: profileSchema,
        },
      });

      const raw = contentToText(result.choices[0]?.message?.content);
      const parsed = parseJsonPayload(raw);
      return {
        summary: parsed.summary,
        model: result.model || "gpt-5-mini",
      };
    } catch (error) {
      const fallbackSummaries: Record<string, string> = {
        fr: `Professionnel(le) passionné(e) et dynamique au poste de ${input.targetRole}, combinant expertise technique et rigueur opérationnelle. Doté(e) d'une forte capacité d'adaptation et du sens du résultat pour valoriser les projets d'entreprise.`,
        en: `Results-driven and strategic ${input.targetRole} with proven expertise in project execution and team collaboration. Dedicated to delivering high standards of quality and measurable business impact.`,
        ar: `مهني متميز ومتمرس في مجال ${input.targetRole}، يجمع بين الكفاءة العالية والدقة في تنفيذ المهام وتحقيق أفضل النتائج.`,
        de: `Engagierte(r) und zielorientierte(r) ${input.targetRole} mit fundierter Erfahrung in operativer Exzellenz und Teamführung.`,
        it: `Professionista orientato ai risultati e proattivo nel ruolo di ${input.targetRole}, con solide competenze gestionali.`,
      };
      return {
        summary: fallbackSummaries[input.language] || fallbackSummaries.fr,
        model: "local-fallback",
      };
    }
  }),

  /* ── 3. Step 1: Single Experience Improvement ── */
  improveExperience: publicProcedure.input(improveExperienceInput).mutation(async ({ input }) => {
    const language = languageNames[input.language];

    // Google Gemini Direct
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        const rawContent = await callGemini({
          systemInstruction: `You are an ATS resume optimization specialist. Turn the candidate's raw experience into 3 to 5 clear, high-impact bullet points in ${language}. Use active verbs and quantify results when possible. Return JSON { "bullets": ["...", "..."] }.`,
          prompt: JSON.stringify({
            targetRole: input.targetRole,
            position: input.role,
            company: input.company,
            rawNotes: input.description,
          }),
        });

        const parsed = parseJsonPayload(rawContent);
        const formattedText = (parsed.bullets || []).map((b: string) => `• ${b.replace(/^[-–—•]\s*/, "")}`).join("\n");
        return {
          bullets: parsed.bullets,
          formattedText,
          model: "Google Gemini 2.5 Flash",
        };
      } catch (err) {
        console.warn("[CV] Gemini experience call error, falling back:", err);
      }
    }

    // Built-in fallback
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        messages: [
          {
            role: "system",
            content: `You are an ATS resume optimization specialist. Turn the candidate's raw experience into 3 to 5 clear, high-impact bullet points in ${language}. Use active verbs and quantify results when possible. Return JSON matching schema.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole: input.targetRole,
              position: input.role,
              company: input.company,
              rawNotes: input.description,
            }),
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: experienceSchema,
        },
      });

      const raw = contentToText(result.choices[0]?.message?.content);
      const parsed = parseJsonPayload(raw);
      const formattedText = (parsed.bullets || []).map((b: string) => `• ${b.replace(/^[-–—•]\s*/, "")}`).join("\n");
      return {
        bullets: parsed.bullets,
        formattedText,
        model: result.model || "gpt-5-mini",
      };
    } catch (error) {
      const rawFacts = splitFacts(input.description);
      const bullets = rawFacts.length >= 2
        ? rawFacts.map((f) => `• ${f}`)
        : [
            `• Gestion et coordination des missions clés au poste de ${input.role}.`,
            `• Collaboration active avec l'équipe de ${input.company} pour l'atteinte des objectifs de performance.`,
            `• Amélioration continue des processus de travail et reporting d'activité.`,
          ];
      return {
        bullets,
        formattedText: bullets.join("\n"),
        model: "local-fallback",
      };
    }
  }),

  /* ── 4. Step 2: Skills & Keywords Suggestion ── */
  improveSkills: publicProcedure.input(improveSkillsInput).mutation(async ({ input }) => {
    const language = languageNames[input.language];

    // Google Gemini Direct
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        const rawContent = await callGemini({
          systemInstruction: `You are a technical recruiter. Suggest 8 to 12 in-demand skills, software tools, and competencies in ${language} for a candidate applying as "${input.targetRole}". Return JSON { "skillsList": ["...", "..."] }.`,
          prompt: JSON.stringify({
            targetRole: input.targetRole,
            existingSkills: input.currentSkills || "",
          }),
        });

        const parsed = parseJsonPayload(rawContent);
        const skillsString = (parsed.skillsList || []).join(" · ");
        return {
          skills: skillsString,
          skillsList: parsed.skillsList,
          model: "Google Gemini 2.5 Flash",
        };
      } catch (err) {
        console.warn("[CV] Gemini skills call error, falling back:", err);
      }
    }

    // Built-in fallback
    try {
      const result = await invokeLLM({
        model: "gpt-5-mini",
        reasoning: { effort: "minimal" },
        messages: [
          {
            role: "system",
            content: `You are a technical recruiter. Suggest 8 to 12 in-demand skills, software tools, and competencies in ${language} for a candidate applying as "${input.targetRole}". Return JSON matching schema.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              targetRole: input.targetRole,
              existingSkills: input.currentSkills || "",
            }),
          },
        ],
        responseFormat: {
          type: "json_schema",
          json_schema: skillsSchema,
        },
      });

      const raw = contentToText(result.choices[0]?.message?.content);
      const parsed = parseJsonPayload(raw);
      const skillsString = (parsed.skillsList || []).join(" · ");
      return {
        skills: skillsString,
        skillsList: parsed.skillsList,
        model: result.model || "gpt-5-mini",
      };
    } catch (error) {
      const defaultSkills: Record<string, string> = {
        fr: `Gestion de projet · Analyse de données · Stratégie de communication · Pack Office & Google Workspace · Outils CRM & ERP · Travail en équipe · Résolution de problèmes · Rigueur & Organisation`,
        en: `Project Management · Data Analysis · Strategic Communication · Microsoft Office & Google Workspace · CRM & ERP Tools · Team Collaboration · Problem Solving · Agile Methodology`,
        ar: `إدارة المشاريع · تحليل البيانات · استراتيجيات التواصل · برمجيات العمل المكتبي · العمل الجماعي · حل المشكلات · التنظيم والدقة`,
        de: `Projektmanagement · Datenanalyse · Strategische Kommunikation · Office-Anwendungen · Teamfähigkeit · Problemlösung · Eigeninitiative`,
        it: `Gestione dei progetti · Analisi dei dati · Comunicazione strategica · Strumenti di produttività · Lavoro di squadra · Problem solving`,
      };
      const skills = defaultSkills[input.language] || defaultSkills.fr;
      return {
        skills,
        skillsList: skills.split(" · "),
        model: "local-fallback",
      };
    }
  }),
});
