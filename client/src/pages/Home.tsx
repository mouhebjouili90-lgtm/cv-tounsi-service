/* CV Tounsi — Expérience duale complète : Profils Expérimentés & Étudiants / Jeunes Diplômés + Version PC & Mobile en parallèle. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { createPdfBlob, type PdfWorkerLike } from "@/lib/pdf";
import {
  improveProfileWithGemini,
  improveExperienceWithGemini,
  improveSkillsWithGemini,
  improveFullCvWithGemini,
  type ProfileType,
} from "@/lib/gemini";
import {
  generateSuggestedCode,
  validateDynamicActivationCode,
} from "@/lib/activation";
import {
  trackEvent,
  trackBuilderStarted,
  trackWhatsAppClicked,
  trackCodeActivated,
  trackPDFDownloaded,
  trackAIUsed,
} from "@/lib/analytics";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth, type SavedCvItem } from "@/contexts/AuthContext";
import { UserSavedCvsModal } from "@/components/auth/UserSavedCvsModal";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  Download,
  FileText,
  Languages,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Phone,
  Sparkles,
  WandSparkles,
  X,
  GraduationCap,
  Briefcase,
  MousePointerClick,
  Plus,
  Trash2,
  Globe,
  ZoomIn,
  ZoomOut,
  Smartphone,
  Monitor,
  Eye,
  Edit3,
  UserCheck,
  BookOpen,
  Lock,
  Unlock,
  ShieldAlert,
  Crown,
  Key,
  MessageCircle,
  User as UserIcon,
  Cloud,
  FolderOpen,
  LogOut,
  Save,
} from "lucide-react";

const heroImage = "/manus-storage/cv-tounsi-hero-reference_82281e8d.jpg";

export type TemplateId = "professional" | "canadian" | "europass";
export type Language = "fr" | "en" | "de" | "it" | "ar";
export type BuilderStep = 0 | 1 | 2 | 3;
export type DeviceMode = "desktop" | "mobile";

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  dates: string;
  location?: string;
  description: string;
};

export type EducationItem = {
  id: string;
  degree: string;
  school: string;
  year: string;
  location?: string;
};

export type TemplateMeta = {
  label: string;
  eyebrow: string;
  description: string;
  short: string;
  badge: string;
  languages: Language[];
};

export const templateCatalog: Record<TemplateId, TemplateMeta> = {
  professional: {
    label: "CV Professionnel",
    eyebrow: "MODÈLE PROFESSIONNEL",
    description: "Design 2 colonnes raffiné avec bannière olive, barre latérale structurée et timeline détaillée.",
    short: "2 Colonnes · Cadre & International",
    badge: "Exécutif & Moderne",
    languages: ["fr", "en", "de", "it", "ar"],
  },
  canadian: {
    label: "CV Canadien (ATS)",
    eyebrow: "MODÈLE CANADIEN / ATS",
    description: "Format nord-américain 1 colonne épuré, centré, sans photo, optimisé pour les logiciels ATS des recruteurs.",
    short: "1 Colonne · Optimisé ATS",
    badge: "Standard Canada & USA",
    languages: ["fr", "en"],
  },
  europass: {
    label: "CV Europass",
    eyebrow: "MODÈLE EUROPASS EU",
    description: "Structure européenne officielle en grille asymétrique avec bandeau bleu EU et timeline normalisée.",
    short: "Grille Asymétrique · Standard UE",
    badge: "Union Européenne",
    languages: ["fr", "en", "de", "it"],
  },
};

export const languageLabels: Record<Language, { name: string; native: string }> = {
  fr: { name: "Français", native: "FR" },
  en: { name: "English", native: "EN" },
  de: { name: "Deutsch", native: "DE" },
  it: { name: "Italiano", native: "IT" },
  ar: { name: "العربية", native: "AR" },
};

export const resumeCopy: Record<
  Language,
  {
    profile: string;
    experience: string;
    studentExperience: string;
    education: string;
    skills: string;
    contact: string;
    languages: string;
    personalInfo: string;
  }
> = {
  fr: {
    profile: "PROFIL PROFESSIONNEL",
    experience: "EXPÉRIENCE PROFESSIONNELLE",
    studentExperience: "PROJETS ACADÉMIQUES, STAGES & BÉNÉVOLAT",
    education: "FORMATION & DIPLÔMES",
    skills: "COMPÉTENCES CLÉS",
    contact: "COORDONNÉES",
    languages: "LANGUES",
    personalInfo: "INFORMATION PERSONNELLE",
  },
  en: {
    profile: "PROFESSIONAL SUMMARY",
    experience: "WORK EXPERIENCE",
    studentExperience: "ACADEMIC PROJECTS & INTERNSHIPS",
    education: "EDUCATION & QUALIFICATIONS",
    skills: "CORE SKILLS",
    contact: "CONTACT",
    languages: "LANGUAGES",
    personalInfo: "PERSONAL INFORMATION",
  },
  de: {
    profile: "BERUFSPROFIL",
    experience: "BERUFSERFAHRUNG",
    studentExperience: "AKADEMISCHE PROJEKTE & PRAKTIKA",
    education: "AUSBILDUNG",
    skills: "KERNKOMPETENZEN",
    contact: "KONTAKT",
    languages: "SPRACHEN",
    personalInfo: "PERSÖNLICHE ANGABEN",
  },
  it: {
    profile: "PROFILO PROFESSIONALE",
    experience: "ESPERIENZA PROFESSIONALE",
    studentExperience: "PROGETTI ACCADEMICI E TIROCINI",
    education: "ISTRUZIONE E FORMAZIONE",
    skills: "COMPETENZE PRINCIPALI",
    contact: "CONTATTI",
    languages: "LINGUE",
    personalInfo: "INFORMAZIONI PERSONALI",
  },
  ar: {
    profile: "الملف المهني",
    experience: "الخبرة المهنية",
    studentExperience: "المشاريع الأكاديمية والتربصات",
    education: "التعليم والتكوين",
    skills: "المهارات الرئيسية",
    contact: "معلومات الاتصال",
    languages: "اللغات",
    personalInfo: "المعلومات الشخصية",
  },
};

export type CvData = {
  profileType: ProfileType;
  fullName: string;
  targetRole: string;
  city: string;
  email: string;
  phone: string;
  profileSummary: string;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  skills: string;
  languagesList: string;
  language: Language;
  template: TemplateId;
};

export const initialData: CvData = {
  profileType: "experienced",
  fullName: "Sarra Ben Salem",
  targetRole: "Marketing & Communication Specialist",
  city: "Tunis, Tunisie",
  email: "sarra.bensalem@email.com",
  phone: "+216 22 345 678",
  profileSummary:
    "Spécialiste opérationnelle en marketing digital combinant vision créative et rigueur analytique. Forte de 4 ans d'expérience dans le pilotage de campagnes multicanales, l'optimisation des conversions et le rayonnement de marques innovantes.",
  experiences: [
    {
      id: "exp-1",
      role: "Chargée de communication & Marketing",
      company: "Studio 216",
      dates: "2022 — Aujourd'hui",
      location: "Tunis, Tunisie",
      description:
        "• Gestion globale de la stratégie de contenu digital sur les réseaux sociaux.\n• Coordination et déploiement de 15+ campagnes publicitaires annuelles avec ROI mesurable.\n• Suivi des indicateurs clés (KPIs) et amélioration de 35% de l'engagement d'audience.\n• Rédaction de communiqués de presse et relation média pour les événements clés.",
    },
    {
      id: "exp-2",
      role: "Assistante Marketing Digital",
      company: "MediaCom Tunisie",
      dates: "2021 — 2022",
      location: "Tunis, Tunisie",
      description:
        "• Création de visuels attractifs et gestion des newsletters hebdomadaires.\n• Veille concurrentielle et analyse des tendances de marché pour orienter les campagnes.",
    },
  ],
  educations: [
    {
      id: "edu-1",
      degree: "Licence Appliquée en Marketing & Stratégie Digitale",
      school: "Institut Supérieur de Gestion de Tunis (ISG)",
      year: "2018 — 2021",
      location: "Tunis, Tunisie",
    },
  ],
  skills:
    "Stratégie de contenu · Canva & Photoshop · Google Analytics 4 · Meta Ads Manager · SEO / SEA · Gestion de projet · Email Marketing · Copywriting",
  languagesList:
    "Arabe (Langue maternelle) · Français (Bilingue) · Anglais (Courant / C1) · Italien (Notions)",
  language: "fr",
  template: "professional",
};

export const studentSampleData: CvData = {
  profileType: "student",
  fullName: "Youssef Mahjoub",
  targetRole: "Étudiant Ingénieur Logiciel (Recherche de Stage PFE)",
  city: "Ariana, Tunis",
  email: "youssef.mahjoub@insat.u-carthage.tn",
  phone: "+216 55 123 456",
  profileSummary:
    "Étudiant en 5ème année d'ingénierie logicielle à l'INSAT, passionné par le développement Full-Stack et les architectures cloud. Doté d'une solide formation académique et d'un bon esprit d'équipe développé au sein de projets de fin d'année et de hackathons. En recherche active d'un stage de fin d'études (PFE) stimulant.",
  experiences: [
    {
      id: "proj-1",
      role: "Projet de Fin d'Année (PFA) — Plateforme Web Interactive",
      company: "INSAT Tunis",
      dates: "2023 — 2024",
      location: "Tunis, Tunisie",
      description:
        "• Conception et développement complet d'une application web avec React, TypeScript et Node.js.\n• Mise en place de l'authentification sécurisée JWT et base de données PostgreSQL.\n• Conteneurisation avec Docker et soutenance devant le jury académique (Note obtenue : 18/20).",
    },
    {
      id: "proj-2",
      role: "Stage d'Initiation & Perfectionnement",
      company: "Sofrecom Tunisie",
      dates: "Été 2023 (2 mois)",
      location: "Tunis, Tunisie",
      description:
        "• Immersion au sein d'une équipe agile (Scrum) et participation aux sprints de développement.\n• Réalisation de tests unitaires et intégration de composants d'interface utilisateur.",
    },
  ],
  educations: [
    {
      id: "edu-1",
      degree: "Diplôme National d'Ingénieur en Informatique",
      school: "Institut National des Sciences Appliquées et de Technologie (INSAT)",
      year: "2021 — 2026 (En cours)",
      location: "Tunis, Tunisie",
    },
    {
      id: "edu-2",
      degree: "Baccalauréat Scientifique (Mention Très Bien)",
      school: "Lycée Pilote de Tunis",
      year: "2021",
      location: "Tunis, Tunisie",
    },
  ],
  skills:
    "React · TypeScript · Node.js · Python · PostgreSQL · Docker · Git & GitHub · Méthodologies Agiles · Travail en équipe · Rigueur & Autonomie",
  languagesList:
    "Arabe (Maternelle) · Français (Bilingue / C2) · Anglais (Courant / C1 TOEIC)",
  language: "fr",
  template: "canadian",
};

const steps = [
  { label: "Vos informations", caption: "Identité, statut & profil", icon: PenLine },
  { label: "Parcours & projets", caption: "Expériences ou projets d'études", icon: Briefcase },
  { label: "Formation & savoir-faire", caption: "Diplômes & compétences clés", icon: GraduationCap },
  { label: "Modèle & langue", caption: "Design & export PDF", icon: FileText },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Form Field Component ─── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: typeof Mail;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-input-wrap">
        {Icon ? <Icon size={15} strokeWidth={1.8} aria-hidden="true" /> : null}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

/* ─── Controlled Editable Zone (Always in sync with State) ─── */
function EditableZone({
  value,
  onChange,
  tag: Tag = "span",
  className = "",
  placeholder = "",
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  tag?: "span" | "p" | "h1" | "h2" | "h3" | "strong" | "small" | "div";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = value || "";
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    if (!ref.current) return;
    const text = (ref.current.innerText || ref.current.textContent || "").trim();
    if (text !== value) {
      onChange(text);
    }
  }, [onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    [multiline],
  );

  return (
    <Tag
      ref={ref as any}
      className={`editable-zone ${className}`}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      title="Cliquez pour modifier directement ce texte"
      spellCheck={false}
    >
      {value || placeholder}
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE 1: CV PROFESSIONNEL (Executive Modern 2-Column with Olive Header)
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfessionalTemplate({
  data,
  onFieldChange,
  editable,
}: {
  data: CvData;
  onFieldChange?: (updater: (prev: CvData) => CvData) => void;
  editable?: boolean;
}) {
  const copy = resumeCopy[data.language];
  const isStudent = data.profileType === "student";

  const updateExp = (idx: number, key: keyof ExperienceItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.experiences];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, experiences: next };
    });
  };

  const updateEdu = (idx: number, key: keyof EducationItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.educations];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, educations: next };
    });
  };

  return (
    <div className="a4-sheet resume-professional-layout" dir={data.language === "ar" ? "rtl" : "ltr"}>
      {/* ── Top Executive Banner ── */}
      <header className="prof-header">
        <div className="prof-header-left">
          <div className="prof-name-block">
            {editable ? (
              <EditableZone
                tag="h1"
                className="prof-name"
                value={data.fullName}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, fullName: val }))}
                placeholder="Votre nom complet"
              />
            ) : (
              <h1 className="prof-name">{data.fullName || "Votre nom complet"}</h1>
            )}
            {editable ? (
              <EditableZone
                tag="p"
                className="prof-role"
                value={data.targetRole}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, targetRole: val }))}
                placeholder="Intitulé du poste recherché"
              />
            ) : (
              <p className="prof-role">{data.targetRole || "Intitulé du poste recherché"}</p>
            )}
          </div>
        </div>

        <div className="prof-header-right">
          <div className="prof-badge-card">
            <span>{isStudent ? "ÉTUDIANT / STAGE" : "CV / TN"}</span>
            <span className="prof-badge-dot" />
            <span>{templateCatalog.professional.eyebrow}</span>
          </div>
        </div>
      </header>

      {/* ── Contact Bar ── */}
      <div className="prof-contact-bar">
        <div className="prof-contact-item">
          <Mail size={13} className="prof-icon" />
          {editable ? (
            <EditableZone
              value={data.email}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, email: val }))}
              placeholder="email@example.com"
            />
          ) : (
            <span>{data.email}</span>
          )}
        </div>
        <div className="prof-contact-item">
          <Phone size={13} className="prof-icon" />
          {editable ? (
            <EditableZone
              value={data.phone}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, phone: val }))}
              placeholder="+216 XX XXX XXX"
            />
          ) : (
            <span>{data.phone}</span>
          )}
        </div>
        <div className="prof-contact-item">
          <MapPin size={13} className="prof-icon" />
          {editable ? (
            <EditableZone
              value={data.city}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, city: val }))}
              placeholder="Tunis, Tunisie"
            />
          ) : (
            <span>{data.city}</span>
          )}
        </div>
      </div>

      {/* ── 2-Column Body ── */}
      <div className="prof-body-grid">
        {/* ── Left Sidebar ── */}
        <aside className="prof-sidebar">
          {/* Compétences */}
          <div className="prof-side-section">
            <h3 className="prof-side-title">
              <Sparkles size={13} className="prof-side-icon" />
              {copy.skills}
            </h3>
            {editable ? (
              <EditableZone
                tag="div"
                className="prof-skills-tags"
                value={data.skills}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, skills: val }))}
                placeholder="Compétence 1 · Compétence 2 · Outil 3..."
                multiline
              />
            ) : (
              <div className="prof-skills-tags">
                {data.skills.split(/[·,،\n]/).map((s) => s.trim()).filter(Boolean).map((skill, idx) => (
                  <span key={idx} className="prof-skill-tag">{skill}</span>
                ))}
              </div>
            )}
          </div>

          {/* Formation (Important pour étudiants) */}
          <div className="prof-side-section">
            <h3 className="prof-side-title">
              <GraduationCap size={13} className="prof-side-icon" />
              {copy.education}
            </h3>
            <div className="prof-edu-list">
              {data.educations.map((edu, idx) => (
                <div key={edu.id || idx} className="prof-edu-item">
                  {editable ? (
                    <>
                      <EditableZone
                        tag="strong"
                        className="prof-edu-degree"
                        value={edu.degree}
                        onChange={(val) => updateEdu(idx, "degree", val)}
                        placeholder="Diplôme obtenu"
                      />
                      <EditableZone
                        tag="div"
                        className="prof-edu-school"
                        value={edu.school}
                        onChange={(val) => updateEdu(idx, "school", val)}
                        placeholder="Établissement / Université"
                      />
                      <EditableZone
                        tag="span"
                        className="prof-edu-year"
                        value={edu.year}
                        onChange={(val) => updateEdu(idx, "year", val)}
                        placeholder="Année"
                      />
                    </>
                  ) : (
                    <>
                      <strong className="prof-edu-degree">{edu.degree}</strong>
                      <div className="prof-edu-school">{edu.school}</div>
                      <span className="prof-edu-year">{edu.year}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div className="prof-side-section">
            <h3 className="prof-side-title">
              <Globe size={13} className="prof-side-icon" />
              {copy.languages}
            </h3>
            {editable ? (
              <EditableZone
                tag="div"
                className="prof-lang-list"
                value={data.languagesList}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, languagesList: val }))}
                placeholder="Arabe (Maternelle) · Français (Bilingue)..."
                multiline
              />
            ) : (
              <div className="prof-lang-list">
                {data.languagesList.split(/[·,،\n]/).map((s) => s.trim()).filter(Boolean).map((lang, idx) => (
                  <div key={idx} className="prof-lang-item">
                    <span className="prof-lang-dot" />
                    <span>{lang}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right Main Column ── */}
        <main className="prof-main-column">
          {/* Profil */}
          <section className="prof-main-section">
            <h2 className="prof-section-heading">
              <span className="prof-heading-accent" />
              {copy.profile}
            </h2>
            {editable ? (
              <EditableZone
                tag="p"
                className="prof-summary-text"
                value={data.profileSummary}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, profileSummary: val }))}
                placeholder="Votre résumé professionnel..."
                multiline
              />
            ) : (
              <p className="prof-summary-text">{data.profileSummary}</p>
            )}
          </section>

          {/* Expériences / Projets Académiques */}
          <section className="prof-main-section">
            <h2 className="prof-section-heading">
              <span className="prof-heading-accent" />
              {isStudent ? copy.studentExperience : copy.experience}
            </h2>

            <div className="prof-timeline">
              {data.experiences.map((exp, idx) => (
                <div key={exp.id || idx} className="prof-timeline-item">
                  <div className="prof-timeline-marker" />
                  <div className="prof-timeline-header">
                    <div className="prof-timeline-role-company">
                      {editable ? (
                        <>
                          <EditableZone
                            tag="strong"
                            className="prof-exp-role"
                            value={exp.role}
                            onChange={(val) => updateExp(idx, "role", val)}
                            placeholder={isStudent ? "Intitulé du projet / stage" : "Intitulé du poste"}
                          />
                          <EditableZone
                            tag="span"
                            className="prof-exp-company"
                            value={exp.company}
                            onChange={(val) => updateExp(idx, "company", val)}
                            placeholder={isStudent ? "Établissement / Entreprise" : "Entreprise"}
                          />
                        </>
                      ) : (
                        <>
                          <strong className="prof-exp-role">{exp.role}</strong>
                          <span className="prof-exp-company">{exp.company}</span>
                        </>
                      )}
                    </div>
                    {editable ? (
                      <EditableZone
                        tag="span"
                        className="prof-exp-dates"
                        value={exp.dates}
                        onChange={(val) => updateExp(idx, "dates", val)}
                        placeholder="Dates"
                      />
                    ) : (
                      <span className="prof-exp-dates">{exp.dates}</span>
                    )}
                  </div>

                  {editable ? (
                    <EditableZone
                      tag="div"
                      className="prof-bullets-list"
                      value={exp.description}
                      onChange={(val) => updateExp(idx, "description", val)}
                      placeholder="• Réalisations clés et technologies utilisées..."
                      multiline
                    />
                  ) : (
                    <ul className="prof-bullets-list">
                      {exp.description.split("\n").map((s) => s.trim()).filter(Boolean).map((bullet, bIdx) => (
                        <li key={bIdx} className="prof-bullet-item">
                          {bullet.replace(/^[-–—•*]\s*/, "")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE 2: CV CANADIEN / ATS (Minimalist North American Single-Column)
   ═══════════════════════════════════════════════════════════════════════════ */
function CanadianTemplate({
  data,
  onFieldChange,
  editable,
}: {
  data: CvData;
  onFieldChange?: (updater: (prev: CvData) => CvData) => void;
  editable?: boolean;
}) {
  const copy = resumeCopy[data.language];
  const isStudent = data.profileType === "student";

  const updateExp = (idx: number, key: keyof ExperienceItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.experiences];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, experiences: next };
    });
  };

  const updateEdu = (idx: number, key: keyof EducationItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.educations];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, educations: next };
    });
  };

  const renderEducationSection = () => (
    <section className="can-section">
      <h2 className="can-section-title">{copy.education}</h2>
      <div className="can-edu-list">
        {data.educations.map((edu, idx) => (
          <div key={edu.id || idx} className="can-edu-block">
            <div className="can-exp-row-top">
              {editable ? (
                <>
                  <EditableZone
                    tag="strong"
                    className="can-edu-degree"
                    value={edu.degree}
                    onChange={(val) => updateEdu(idx, "degree", val)}
                    placeholder="Diplôme"
                  />
                  <EditableZone
                    tag="span"
                    className="can-edu-year"
                    value={edu.year}
                    onChange={(val) => updateEdu(idx, "year", val)}
                    placeholder="Année"
                  />
                </>
              ) : (
                <>
                  <strong className="can-edu-degree">{edu.degree}</strong>
                  <span className="can-edu-year">{edu.year}</span>
                </>
              )}
            </div>
            <div className="can-exp-row-sub">
              {editable ? (
                <EditableZone
                  tag="span"
                  className="can-edu-school"
                  value={edu.school}
                  onChange={(val) => updateEdu(idx, "school", val)}
                  placeholder="Établissement"
                />
              ) : (
                <span className="can-edu-school">{edu.school}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderExperienceSection = () => (
    <section className="can-section">
      <h2 className="can-section-title">{isStudent ? copy.studentExperience : copy.experience}</h2>
      <div className="can-exp-list">
        {data.experiences.map((exp, idx) => (
          <div key={exp.id || idx} className="can-exp-block">
            <div className="can-exp-row-top">
              {editable ? (
                <>
                  <EditableZone
                    tag="strong"
                    className="can-exp-role"
                    value={exp.role}
                    onChange={(val) => updateExp(idx, "role", val)}
                    placeholder={isStudent ? "Projet / Stage" : "Intitulé du poste"}
                  />
                  <EditableZone
                    tag="span"
                    className="can-exp-dates"
                    value={exp.dates}
                    onChange={(val) => updateExp(idx, "dates", val)}
                    placeholder="Période"
                  />
                </>
              ) : (
                <>
                  <strong className="can-exp-role">{exp.role}</strong>
                  <span className="can-exp-dates">{exp.dates}</span>
                </>
              )}
            </div>
            <div className="can-exp-row-sub">
              {editable ? (
                <>
                  <EditableZone
                    tag="span"
                    className="can-exp-company"
                    value={exp.company}
                    onChange={(val) => updateExp(idx, "company", val)}
                    placeholder={isStudent ? "Établissement / Organisme" : "Entreprise"}
                  />
                  <EditableZone
                    tag="span"
                    className="can-exp-loc"
                    value={exp.location || ""}
                    onChange={(val) => updateExp(idx, "location", val)}
                    placeholder="Lieu"
                  />
                </>
              ) : (
                <>
                  <span className="can-exp-company">{exp.company}</span>
                  <span className="can-exp-loc">{exp.location || data.city}</span>
                </>
              )}
            </div>

            {editable ? (
              <EditableZone
                tag="div"
                className="can-bullets"
                value={exp.description}
                onChange={(val) => updateExp(idx, "description", val)}
                placeholder="• Missions et réalisations..."
                multiline
              />
            ) : (
              <ul className="can-bullets">
                {exp.description.split("\n").map((s) => s.trim()).filter(Boolean).map((b, bIdx) => (
                  <li key={bIdx} className="can-bullet-item">
                    {b.replace(/^[-–—•*]\s*/, "")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="a4-sheet resume-canadian-layout" dir={data.language === "ar" ? "rtl" : "ltr"}>
      <header className="can-header">
        {editable ? (
          <EditableZone
            tag="h1"
            className="can-name"
            value={data.fullName}
            onChange={(val) => onFieldChange?.((prev) => ({ ...prev, fullName: val }))}
            placeholder="VOTRE NOM COMPLET"
          />
        ) : (
          <h1 className="can-name">{data.fullName || "VOTRE NOM COMPLET"}</h1>
        )}

        {editable ? (
          <EditableZone
            tag="p"
            className="can-title"
            value={data.targetRole}
            onChange={(val) => onFieldChange?.((prev) => ({ ...prev, targetRole: val }))}
            placeholder="INTITULÉ DU POSTE VISÉ"
          />
        ) : (
          <p className="can-title">{data.targetRole || "INTITULÉ DU POSTE VISÉ"}</p>
        )}

        <div className="can-contact-line">
          {editable ? (
            <>
              <EditableZone
                value={data.city}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, city: val }))}
                placeholder="Ville, Pays"
              />
              <span className="can-sep">•</span>
              <EditableZone
                value={data.phone}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, phone: val }))}
                placeholder="+216 XX XXX XXX"
              />
              <span className="can-sep">•</span>
              <EditableZone
                value={data.email}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, email: val }))}
                placeholder="email@example.com"
              />
            </>
          ) : (
            <>
              <span>{data.city}</span>
              <span className="can-sep">•</span>
              <span>{data.phone}</span>
              <span className="can-sep">•</span>
              <span>{data.email}</span>
            </>
          )}
        </div>
      </header>

      {/* Profil */}
      <section className="can-section">
        <h2 className="can-section-title">{copy.profile}</h2>
        {editable ? (
          <EditableZone
            tag="p"
            className="can-summary"
            value={data.profileSummary}
            onChange={(val) => onFieldChange?.((prev) => ({ ...prev, profileSummary: val }))}
            placeholder="Sommaire professionnel..."
            multiline
          />
        ) : (
          <p className="can-summary">{data.profileSummary}</p>
        )}
      </section>

      {/* Ordre dynamique : pour un étudiant, la FORMATION passe en 1er ! */}
      {isStudent ? (
        <>
          {renderEducationSection()}
          {renderExperienceSection()}
        </>
      ) : (
        <>
          {renderExperienceSection()}
          {renderEducationSection()}
        </>
      )}

      {/* Compétences */}
      <section className="can-section">
        <h2 className="can-section-title">{copy.skills}</h2>
        {editable ? (
          <EditableZone
            tag="div"
            className="can-skills-grid"
            value={data.skills}
            onChange={(val) => onFieldChange?.((prev) => ({ ...prev, skills: val }))}
            placeholder="Compétence 1 · Compétence 2..."
            multiline
          />
        ) : (
          <div className="can-skills-grid">
            {data.skills.split(/[·,،\n]/).map((s) => s.trim()).filter(Boolean).map((skill, idx) => (
              <div key={idx} className="can-skill-item">
                <span className="can-bullet-dot">▪</span>
                <span>{skill}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Langues */}
      <section className="can-section">
        <h2 className="can-section-title">{copy.languages}</h2>
        {editable ? (
          <EditableZone
            tag="p"
            className="can-languages-text"
            value={data.languagesList}
            onChange={(val) => onFieldChange?.((prev) => ({ ...prev, languagesList: val }))}
            placeholder="Langues..."
          />
        ) : (
          <p className="can-languages-text">{data.languagesList}</p>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEMPLATE 3: CV EUROPASS (Official European Asymmetric Split Grid)
   ═══════════════════════════════════════════════════════════════════════════ */
function EuropassTemplate({
  data,
  onFieldChange,
  editable,
}: {
  data: CvData;
  onFieldChange?: (updater: (prev: CvData) => CvData) => void;
  editable?: boolean;
}) {
  const copy = resumeCopy[data.language];
  const isStudent = data.profileType === "student";

  const updateExp = (idx: number, key: keyof ExperienceItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.experiences];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, experiences: next };
    });
  };

  const updateEdu = (idx: number, key: keyof EducationItem, val: string) => {
    onFieldChange?.((prev) => {
      const next = [...prev.educations];
      next[idx] = { ...next[idx], [key]: val };
      return { ...prev, educations: next };
    });
  };

  const renderEduRow = () => (
    <div className="euro-grid-row">
      <div className="euro-col-left">
        <h2 className="euro-section-title">{copy.education}</h2>
      </div>
      <div className="euro-col-right">
        {data.educations.map((edu, idx) => (
          <div key={edu.id || idx} className="euro-item-block">
            {editable ? (
              <>
                <EditableZone
                  tag="div"
                  className="euro-item-dates"
                  value={edu.year}
                  onChange={(val) => updateEdu(idx, "year", val)}
                  placeholder="Année"
                />
                <EditableZone
                  tag="div"
                  className="euro-item-role"
                  value={edu.degree}
                  onChange={(val) => updateEdu(idx, "degree", val)}
                  placeholder="Diplôme"
                />
                <EditableZone
                  tag="div"
                  className="euro-item-org"
                  value={edu.school}
                  onChange={(val) => updateEdu(idx, "school", val)}
                  placeholder="Établissement"
                />
              </>
            ) : (
              <>
                <div className="euro-item-dates">{edu.year}</div>
                <div className="euro-item-role">{edu.degree}</div>
                <div className="euro-item-org">{edu.school} — {edu.location || data.city}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderExpRow = () => (
    <div className="euro-grid-row">
      <div className="euro-col-left">
        <h2 className="euro-section-title">{isStudent ? copy.studentExperience : copy.experience}</h2>
      </div>
      <div className="euro-col-right">
        {data.experiences.map((exp, idx) => (
          <div key={exp.id || idx} className="euro-item-block">
            {editable ? (
              <>
                <EditableZone
                  tag="div"
                  className="euro-item-dates"
                  value={exp.dates}
                  onChange={(val) => updateExp(idx, "dates", val)}
                  placeholder="Période"
                />
                <EditableZone
                  tag="div"
                  className="euro-item-role"
                  value={exp.role}
                  onChange={(val) => updateExp(idx, "role", val)}
                  placeholder={isStudent ? "Projet / Stage" : "Intitulé du poste"}
                />
                <div style={{ display: "flex", gap: "6px" }}>
                  <EditableZone
                    tag="span"
                    className="euro-item-org"
                    value={exp.company}
                    onChange={(val) => updateExp(idx, "company", val)}
                    placeholder={isStudent ? "Établissement / Organisme" : "Entreprise"}
                  />
                  <EditableZone
                    tag="span"
                    className="euro-item-org"
                    value={exp.location || ""}
                    onChange={(val) => updateExp(idx, "location", val)}
                    placeholder="Lieu"
                  />
                </div>
                <EditableZone
                  tag="div"
                  className="euro-bullets"
                  value={exp.description}
                  onChange={(val) => updateExp(idx, "description", val)}
                  placeholder="• Réalisations et missions..."
                  multiline
                />
              </>
            ) : (
              <>
                <div className="euro-item-dates">{exp.dates}</div>
                <div className="euro-item-role">{exp.role}</div>
                <div className="euro-item-org">{exp.company} — {exp.location || data.city}</div>
                <ul className="euro-bullets">
                  {exp.description.split("\n").map((s) => s.trim()).filter(Boolean).map((b, bIdx) => (
                    <li key={bIdx}>{b.replace(/^[-–—•*]\s*/, "")}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="a4-sheet resume-europass-layout" dir={data.language === "ar" ? "rtl" : "ltr"}>
      <header className="euro-header">
        <div className="euro-logo-box">
          <div className="euro-flag-icon">★ europass</div>
          <span className="euro-subtitle">Curriculum Vitae</span>
        </div>
        <div className="euro-meta-tag">
          {editable ? (
            <EditableZone
              value={data.targetRole}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, targetRole: val }))}
              placeholder="Candidature"
            />
          ) : (
            <span>{data.targetRole || "Candidature"}</span>
          )}
        </div>
      </header>

      {/* Information Personnelle */}
      <div className="euro-grid-row">
        <div className="euro-col-left">
          <h2 className="euro-section-title">{copy.personalInfo}</h2>
        </div>
        <div className="euro-col-right">
          <div className="euro-person-name">
            {editable ? (
              <EditableZone
                tag="h1"
                className="euro-name-text"
                value={data.fullName}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, fullName: val }))}
                placeholder="Votre nom complet"
              />
            ) : (
              <h1 className="euro-name-text">{data.fullName}</h1>
            )}
          </div>
          <div className="euro-contact-table">
            <div className="euro-contact-row">
              <span className="euro-label">Adresse :</span>
              {editable ? (
                <EditableZone
                  value={data.city}
                  onChange={(val) => onFieldChange?.((prev) => ({ ...prev, city: val }))}
                  placeholder="Tunis, Tunisie"
                />
              ) : (
                <span>{data.city}</span>
              )}
            </div>
            <div className="euro-contact-row">
              <span className="euro-label">Téléphone :</span>
              {editable ? (
                <EditableZone
                  value={data.phone}
                  onChange={(val) => onFieldChange?.((prev) => ({ ...prev, phone: val }))}
                  placeholder="+216 XX XXX XXX"
                />
              ) : (
                <span>{data.phone}</span>
              )}
            </div>
            <div className="euro-contact-row">
              <span className="euro-label">Courriel :</span>
              {editable ? (
                <EditableZone
                  value={data.email}
                  onChange={(val) => onFieldChange?.((prev) => ({ ...prev, email: val }))}
                  placeholder="email@example.com"
                />
              ) : (
                <span>{data.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profil */}
      <div className="euro-grid-row">
        <div className="euro-col-left">
          <h2 className="euro-section-title">{copy.profile}</h2>
        </div>
        <div className="euro-col-right">
          {editable ? (
            <EditableZone
              tag="p"
              className="euro-text"
              value={data.profileSummary}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, profileSummary: val }))}
              placeholder="Profil..."
              multiline
            />
          ) : (
            <p className="euro-text">{data.profileSummary}</p>
          )}
        </div>
      </div>

      {/* Ordre dynamique selon le profil */}
      {isStudent ? (
        <>
          {renderEduRow()}
          {renderExpRow()}
        </>
      ) : (
        <>
          {renderExpRow()}
          {renderEduRow()}
        </>
      )}

      {/* Compétences */}
      <div className="euro-grid-row">
        <div className="euro-col-left">
          <h2 className="euro-section-title">{copy.skills}</h2>
        </div>
        <div className="euro-col-right">
          {editable ? (
            <EditableZone
              tag="div"
              className="euro-skills-chips"
              value={data.skills}
              onChange={(val) => onFieldChange?.((prev) => ({ ...prev, skills: val }))}
              placeholder="Compétence 1 · Compétence 2..."
              multiline
            />
          ) : (
            <div className="euro-skills-chips">
              {data.skills.split(/[·,،\n]/).map((s) => s.trim()).filter(Boolean).map((skill, idx) => (
                <span key={idx} className="euro-skill-badge">{skill}</span>
              ))}
            </div>
          )}

          <div className="euro-lang-block" style={{ marginTop: "8px" }}>
            <strong className="euro-sub-label">{copy.languages} :</strong>
            {editable ? (
              <EditableZone
                tag="p"
                className="euro-text"
                value={data.languagesList}
                onChange={(val) => onFieldChange?.((prev) => ({ ...prev, languagesList: val }))}
                placeholder="Langues..."
              />
            ) : (
              <p className="euro-text">{data.languagesList}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Generic ResumePreview Dispatcher ─── */
export function ResumePreview({
  data,
  onFieldChange,
  editable = false,
}: {
  data: CvData;
  onFieldChange?: (updater: (prev: CvData) => CvData) => void;
  editable?: boolean;
}) {
  switch (data.template) {
    case "canadian":
      return (
        <CanadianTemplate
          data={data}
          onFieldChange={onFieldChange}
          editable={editable}
        />
      );
    case "europass":
      return (
        <EuropassTemplate
          data={data}
          onFieldChange={onFieldChange}
          editable={editable}
        />
      );
    case "professional":
    default:
      return (
        <ProfessionalTemplate
          data={data}
          onFieldChange={onFieldChange}
          editable={editable}
        />
      );
  }
}

/* ─── Responsive Scaled Preview Container with Zoom & Direct Editing Tools ─── */
function ScaledResumePreview({
  data,
  onFieldChange,
  editable = true,
  isMobileMode = false,
  isUnlocked = false,
  isScreenProtected = false,
  onOpenPaywall,
}: {
  data: CvData;
  onFieldChange?: (updater: (prev: CvData) => CvData) => void;
  editable?: boolean;
  isMobileMode?: boolean;
  isUnlocked?: boolean;
  isScreenProtected?: boolean;
  onOpenPaywall?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(isMobileMode ? 0.46 : 0.85);
  const [manualZoom, setManualZoom] = useState<number | null>(null);

  const currentScale = manualZoom !== null ? manualZoom : autoScale;

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const availableWidth = wrapperRef.current.clientWidth - (isMobileMode ? 16 : 40);
        const minScale = isMobileMode ? 0.35 : 0.65;
        const maxScale = isMobileMode ? 0.85 : 1.15;
        const newScale = Math.min(Math.max(availableWidth / 794, minScale), maxScale);
        setAutoScale(Math.round(newScale * 100) / 100);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMode]);

  const zoomIn = () => {
    setManualZoom((prev) => {
      const base = prev ?? autoScale;
      return Math.min(Math.round((base + 0.1) * 10) / 10, 1.35);
    });
  };

  const zoomOut = () => {
    setManualZoom((prev) => {
      const base = prev ?? autoScale;
      return Math.max(Math.round((base - 0.1) * 10) / 10, 0.35);
    });
  };

  const resetZoom = () => {
    setManualZoom(null);
  };

  const setFixedZoom = (val: number) => {
    setManualZoom(val);
  };

  return (
    <div
      className={`preview-container-root ${!isUnlocked ? "anti-screenshot-protected" : ""}`}
      onContextMenu={(e) => {
        if (!isUnlocked) {
          e.preventDefault();
          toast.info("Aperçu protégé : Utilisez le bouton Télécharger pour obtenir le document.");
        }
      }}
    >
      {/* ── Zoom & Edit Toolbar ── */}
      <div className="preview-toolbar-controls">
        <div className="preview-toolbar-left">
          <span className="live-edit-indicator">
            <span className="live-edit-pulse" />
            <MousePointerClick size={14} />
            <span><b>Aperçu Dynamique & Édition Directe</b></span>
          </span>
          {!isUnlocked && (
            <span
              style={{
                marginLeft: "8px",
                fontSize: "0.64rem",
                background: "#fde8e8",
                color: "#c83b3b",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Lock size={10} /> Mode Démo (19 TND)
            </span>
          )}
        </div>

        <div className="zoom-buttons-group">
          <button type="button" onClick={zoomOut} className="zoom-btn" title="Dézoomer (-10%)">
            <ZoomOut size={13} />
          </button>
          <span className="zoom-percentage-badge">{Math.round(currentScale * 100)}%</span>
          <button type="button" onClick={zoomIn} className="zoom-btn" title="Zoomer (+10%)">
            <ZoomIn size={13} />
          </button>

          <button
            type="button"
            onClick={resetZoom}
            className={`zoom-preset-btn ${manualZoom === null ? "active" : ""}`}
            title="Ajuster automatiquement"
          >
            Ajuster
          </button>
          {!isMobileMode && (
            <>
              <button
                type="button"
                onClick={() => setFixedZoom(0.85)}
                className={`zoom-preset-btn ${manualZoom === 0.85 ? "active" : ""}`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => setFixedZoom(1.0)}
                className={`zoom-preset-btn ${manualZoom === 1.0 ? "active" : ""}`}
              >
                100%
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Scrollable Stage Viewport ── */}
      <div ref={wrapperRef} className="preview-scrollable-viewport" style={{ position: "relative" }}>
        {/* Anti-Screenshot Shield Overlay */}
        {!isUnlocked && isScreenProtected && (
          <div className="screen-blur-guard-overlay">
            <ShieldAlert size={40} color="#e1b0a6" />
            <h4>🛡️ Aperçu Protégé — CV Tounsi</h4>
            <p>
              Les captures d'écran sont désactivées sur cette version d'aperçu.<br />
              Obtenez votre CV complet en PDF haute résolution A4 pour seulement <b>19 TND</b>.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={onOpenPaywall}
              style={{ fontSize: "0.78rem", padding: "0.5rem 1.1rem" }}
            >
              Débloquer la version complète (19 TND)
            </button>
          </div>
        )}

        <div
          className="preview-scale-wrapper"
          style={{
            width: `${Math.round(794 * currentScale)}px`,
            height: `${Math.round(1123 * currentScale)}px`,
            minHeight: `${Math.round(1123 * currentScale)}px`,
            position: "relative",
          }}
        >
          {/* Subtle live watermark for demo mode */}
          {!isUnlocked && (
            <>
              <div className="live-watermark-strip" />
              <div className="live-watermark-text">CV TOUNSI DÉMO</div>
            </>
          )}

          <div
            className="preview-scale-content"
            style={{
              transform: `scale(${currentScale})`,
              transformOrigin: "top left",
              width: "794px",
              minHeight: "1123px",
            }}
          >
            <ResumePreview
              data={data}
              onFieldChange={onFieldChange}
              editable={editable}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Template Mini Thumbnails for Catalog ─── */
function TemplateMini({ template }: { template: TemplateId }) {
  if (template === "canadian") {
    return (
      <div className="mini-paper canadian-mini">
        <div className="mini-title-center" />
        <div className="mini-rule-full" />
        <div className="mini-lines" />
        <div className="mini-rule-full" />
        <div className="mini-lines" />
      </div>
    );
  }
  if (template === "europass") {
    return (
      <div className="mini-paper europass-mini">
        <div className="europass-top-bar" />
        <div className="europass-split-grid">
          <div className="europass-left-col"><i /><i /></div>
          <div className="europass-right-col"><i /><i /><i /></div>
        </div>
      </div>
    );
  }
  return (
    <div className="mini-paper professional-mini">
      <div className="prof-mini-banner" />
      <div className="prof-mini-body">
        <div className="prof-mini-side" />
        <div className="prof-mini-main"><i /><i /><i /></div>
      </div>
    </div>
  );
}

function LanguagePills({ languages }: { languages: Language[] }) {
  return (
    <div className="template-language-pills">
      {languages.map((language) => (
        <span key={language}>{languageLabels[language].native}</span>
      ))}
    </div>
  );
}

/* ─── Landing Page ─── */
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main>
      <section
        className="hero-shell"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(248,243,232,.2), rgba(248,243,232,.95) 58%, #f8f3e8 100%), url(${heroImage})`,
        }}
      >
        <div className="container hero-content">
          <div className="hero-copy reveal-up">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> CV BUILDER / TN
            </div>
            <h1>
              Votre parcours existe.
              <br />
              <em>Nous le rendons visible.</em>
            </h1>
            <p className="hero-lead">
              Une solution tunisienne qui adapte votre CV que vous soyez <b>professionnel expérimenté</b> ou <b>étudiant / jeune diplômé</b> — en français, anglais, allemand, italien ou arabe.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={onStart}>
                Créer mon CV <ArrowLeft size={18} />
              </button>
              <button className="button button-quiet" onClick={() => scrollToId("templates")}>
                Voir les modèles <ArrowUpLeft size={16} />
              </button>
            </div>
            <div className="hero-note">
              <span className="mini-check">
                <Check size={12} />
              </span>{" "}
              Profils Expérimentés & Étudiants · 3 modèles distincts · Compatible PC & Téléphone
            </div>
          </div>
          <div className="hero-preview reveal-up delay-1">
            <div className="preview-note">
              <span>Votre feuille de travail</span>
              <span>01 / 03</span>
            </div>
            <div className="hero-preview-box">
              <ResumePreview data={initialData} />
            </div>
          </div>
        </div>
      </section>

      <section className="signal-strip">
        <div className="container signal-grid">
          <div className="signal-intro">
            <span>Pourquoi CV Tounsi ?</span>
            <strong>Votre professionnalisme commence par votre présentation.</strong>
          </div>
          <div className="signal-item">
            <span className="signal-number">01</span>
            <div>
              <strong>Expérimenté ou Étudiant</strong>
              <p>Structure personnalisée mettant en valeur vos postes ou vos projets d'études.</p>
            </div>
          </div>
          <div className="signal-item">
            <span className="signal-number">02</span>
            <div>
              <strong>Expérience PC & Téléphone</strong>
              <p>Éditez en toute fluidité sur ordinateur ou smartphone avec aperçu live.</p>
            </div>
          </div>
          <div className="signal-item">
            <span className="signal-number">03</span>
            <div>
              <strong>Export PDF A4 Impeccable</strong>
              <p>Un fichier haute définition prêt à être transmis aux recruteurs.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="templates-section" id="templates">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">La bibliothèque de modèles</div>
              <h2>
                Trois formats.<br />
                <em>Trois styles bien distincts.</em>
              </h2>
            </div>
            <p>
              Choisissez la structure qui correspond à votre projet professionnel, puis générez une version
              dans la langue demandée.
            </p>
          </div>
          <div className="template-gallery template-gallery-three">
            {(Object.entries(templateCatalog) as [TemplateId, TemplateMeta][]).map(
              ([id, template], index) => (
                <article className={`template-card template-card-${id}`} key={id}>
                  <div className="template-label">
                    <span>{template.eyebrow}</span>
                    <span>0{index + 1}</span>
                  </div>
                  <TemplateMini template={id} />
                  <div className="template-card-bottom">
                    <div>
                      <span className="template-badge-pill">{template.badge}</span>
                      <h3>{template.label}</h3>
                      <p>{template.description}</p>
                      <LanguagePills languages={template.languages} />
                    </div>
                    <button
                      className="circle-arrow"
                      onClick={onStart}
                      aria-label={`Choisir le ${template.label}`}
                    >
                      <ArrowLeft size={17} />
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ─── Builder (Step-by-Step with Student vs Experienced Profile Differentiation) ─── */
function Builder({
  data,
  setData,
  onBack,
  activeCvId,
  setActiveCvId,
  onOpenSavedCvs,
}: {
  data: CvData;
  setData: React.Dispatch<React.SetStateAction<CvData>>;
  onBack: () => void;
  activeCvId?: number | null;
  setActiveCvId?: (id: number | null) => void;
  onOpenSavedCvs?: () => void;
}) {
  const { user, openAuthModal, saveCvToCloud, savedCvs } = useAuth();
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [step, setStep] = useState<BuilderStep>(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 850 ? "mobile" : "desktop"
  );
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  const handleSaveToCloud = async () => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    setIsSavingCloud(true);
    try {
      const saved = await saveCvToCloud({
        id: activeCvId || undefined,
        title: `${data.fullName || "Mon CV"} — ${data.targetRole || "Candidat"}`,
        dataJson: data,
        template: data.template,
        language: data.language,
        isUnlocked,
      });

      if (saved && setActiveCvId) {
        setActiveCvId(saved.id);
      }
    } finally {
      setIsSavingCloud(false);
    }
  };

  /* ── SaaS Monetization & Client Activation Code State ── */
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cv_tounsi_client_unlocked") === "true";
    }
    return false;
  });
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isScreenProtected, setIsScreenProtected] = useState(false);
  const [clientCodeInput, setClientCodeInput] = useState("");

  const [isExporting, setIsExporting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [expLoadingIdx, setExpLoadingIdx] = useState<number | null>(null);
  const [isSkillsLoading, setIsSkillsLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const printTargetRef = useRef<HTMLDivElement | null>(null);

  const isStudent = data.profileType === "student";

  /* ── Anti-Screenshot & Screen Guard Detector ── */
  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") ||
        (e.metaKey && e.shiftKey)
      ) {
        setIsScreenProtected(true);
        toast.warning("Capture d'écran désactivée. Utilisez votre code de déblocage pour obtenir le PDF HD.");
        setTimeout(() => setIsScreenProtected(false), 3200);
      }
    };

    const handleWindowBlur = () => {
      setIsScreenProtected(true);
    };

    const handleWindowFocus = () => {
      setTimeout(() => {
        setIsScreenProtected(false);
      }, 700);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isUnlocked]);

  /* ── Verify existing activation token on mount with server ── */
  useEffect(() => {
    const savedToken = localStorage.getItem("cv_tounsi_client_token");
    if (savedToken) {
      fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: savedToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsUnlocked(true);
            localStorage.setItem("cv_tounsi_client_unlocked", "true");
          } else {
            setIsUnlocked(false);
            localStorage.removeItem("cv_tounsi_client_unlocked");
            localStorage.removeItem("cv_tounsi_client_token");
          }
        })
        .catch(() => {
          // Keep current state if network is unavailable
        });
    }
  }, []);

  /* ── Dynamic & Memorable Client Activation Code Unlock Handler (Server-Validated) ── */
  const handleUnlockWithClientCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientCodeInput.trim()) return;

    try {
      // Priority 1: Server-side validation with HMAC signed token
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clientCodeInput.trim(),
          fullName: data.fullName,
        }),
      });

      const result = await res.json();

      if (result.valid) {
        setIsUnlocked(true);
        if (result.token) {
          localStorage.setItem("cv_tounsi_client_token", result.token);
        }
        localStorage.setItem("cv_tounsi_client_unlocked", "true");
        setShowPaywallModal(false);
        trackCodeActivated("WhatsAppCode");
        toast.success("✅ Code d'activation validé avec succès ! Votre CV est débloqué.");
        executeDownloadPdf(false);
        return;
      }
    } catch {
      // Fallback: Local validation if network error
      const isValidLocal = validateDynamicActivationCode(clientCodeInput, data.fullName);
      if (isValidLocal) {
        setIsUnlocked(true);
        localStorage.setItem("cv_tounsi_client_unlocked", "true");
        setShowPaywallModal(false);
        trackCodeActivated("LocalFallback");
        toast.success("✅ Code d'activation validé avec succès ! Votre CV est débloqué.");
        executeDownloadPdf(false);
        return;
      }
    }

    toast.error("Code d'activation incorrect. Veuillez vérifier le code reçu sur WhatsApp (+216 95 669 209).");
  };

  const handleRelockForTest = () => {
    setIsUnlocked(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cv_tounsi_client_unlocked");
      localStorage.removeItem("cv_tounsi_client_token");
    }
    toast.info("Mode Démo réactivé (Flou & Filigrane réactivés pour tester).");
  };

  const update = (key: keyof CvData, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectProfileType = (type: ProfileType) => {
    if (type === "student" && data.profileType !== "student") {
      setData((prev) => ({
        ...prev,
        profileType: "student",
        targetRole: prev.targetRole.includes("Specialist") ? "Étudiant Ingénieur (Recherche de Stage PFE)" : prev.targetRole,
      }));
      toast.info("Profil Étudiant / Jeune diplômé activé : vos formations et projets d'études seront mis en avant.");
    } else if (type === "experienced" && data.profileType !== "experienced") {
      setData((prev) => ({
        ...prev,
        profileType: "experienced",
      }));
      toast.info("Profil Expérimenté activé : vos postes et réalisations professionnelles sont mis en avant.");
    }
  };

  const loadSample = (type: ProfileType) => {
    if (type === "student") {
      setData(studentSampleData);
      toast.success("Exemple de CV Étudiant (Stage PFE / Projets d'études) chargé avec succès !");
    } else {
      setData(initialData);
      toast.success("Exemple de CV Professionnel Expérimenté chargé avec succès !");
    }
  };

  const selectTemplate = (template: TemplateId) => {
    const allowedLanguages = templateCatalog[template].languages;
    const language = allowedLanguages.includes(data.language) ? data.language : allowedLanguages[0];
    setData((prev) => ({ ...prev, template, language }));
  };

  const addExperience = () => {
    setData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}`,
          role: isStudent ? "Nouveau projet d'études / stage" : "Nouveau poste",
          company: isStudent ? "Université / Organisme" : "Nom de l'entreprise",
          dates: "2023 — Présent",
          location: "Tunis, Tunisie",
          description: isStudent ? "• Conception, technologies utilisées et résultats..." : "• Missions et réalisations clés...",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const updateExperience = (index: number, key: keyof ExperienceItem, val: string) => {
    setData((prev) => {
      const nextExp = [...prev.experiences];
      nextExp[index] = { ...nextExp[index], [key]: val };
      return { ...prev, experiences: nextExp };
    });
  };

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      educations: [
        ...prev.educations,
        {
          id: `edu-${Date.now()}`,
          degree: "Nouveau diplôme ou certification",
          school: "Nom de l'établissement",
          year: "2022",
          location: "Tunisie",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setData((prev) => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, key: keyof EducationItem, val: string) => {
    setData((prev) => {
      const nextEdu = [...prev.educations];
      nextEdu[index] = { ...nextEdu[index], [key]: val };
      return { ...prev, educations: nextEdu };
    });
  };

  const goNext = () => {
    if (step < 3) setStep((step + 1) as BuilderStep);
  };
  const goPrev = () => {
    if (step > 0) setStep((step - 1) as BuilderStep);
  };

  /* ── Step 0: Optimize Profile Hook with AI ── */
  const handleImproveProfile = async () => {
    setIsProfileLoading(true);
    trackAIUsed("ProfileHook");
    try {
      const summary = await improveProfileWithGemini({
        language: data.language,
        targetRole: data.targetRole || (isStudent ? "Étudiant / Futur Diplômé" : "Professionnel"),
        currentSummary: data.profileSummary,
        profileType: data.profileType,
      });
      setData((prev) => ({ ...prev, profileSummary: summary }));
      toast.success(isStudent ? "Accroche étudiante optimisée par l'IA !" : "Accroche professionnelle optimisée par l'IA !");
    } catch (error) {
      toast.error("Impossible d'améliorer le profil pour le moment.");
    } finally {
      setIsProfileLoading(false);
    }
  };

  /* ── Step 1: Optimize Specific Experience / Project with AI ── */
  const handleImproveExperience = async (idx: number) => {
    const exp = data.experiences[idx];
    if (!exp) return;
    setExpLoadingIdx(idx);
    trackAIUsed(`Experience_${idx}`);

    try {
      const formatted = await improveExperienceWithGemini({
        language: data.language,
        targetRole: data.targetRole || exp.role,
        role: exp.role || (isStudent ? "Projet d'études" : "Poste"),
        company: exp.company || (isStudent ? "Université" : "Entreprise"),
        description: exp.description || "Détails et activités",
        profileType: data.profileType,
      });

      updateExperience(idx, "description", formatted);
      toast.success(isStudent ? `Le projet #${idx + 1} (${exp.role}) a été valorisé en réalisations concrètes !` : `L'expérience #${idx + 1} a été optimisée en puces d'impact !`);
    } catch (error) {
      toast.error("Impossible d'améliorer cette rubrique pour le moment.");
    } finally {
      setExpLoadingIdx(null);
    }
  };

  /* ── Step 2: Suggest Skills with AI ── */
  const handleImproveSkills = async () => {
    setIsSkillsLoading(true);
    trackAIUsed("SkillsSuggestion");
    try {
      const skills = await improveSkillsWithGemini({
        language: data.language,
        targetRole: data.targetRole || (isStudent ? "Étudiant / Junior" : "Professionnel"),
        currentSkills: data.skills,
        profileType: data.profileType,
      });
      setData((prev) => ({ ...prev, skills }));
      toast.success(isStudent ? "Compétences académiques et techniques suggérées par l'IA !" : "Compétences clés suggérées par l'IA !");
    } catch (error) {
      toast.error("Impossible de suggérer les compétences pour le moment.");
    } finally {
      setIsSkillsLoading(false);
    }
  };

  /* ── Global Copy Optimization with AI ── */
  const improveCopy = async () => {
    setIsGlobalLoading(true);
    trackAIUsed("FullCVHarmonization");
    try {
      const firstExp = data.experiences[0] || {
        role: isStudent ? "Projet d'études" : "Spécialiste",
        company: isStudent ? "Université" : "Entreprise",
        description: "Missions",
      };
      const result = await improveFullCvWithGemini({
        language: data.language,
        targetRole: data.targetRole,
        experienceRole: firstExp.role,
        company: firstExp.company,
        experienceText: firstExp.description,
        profileType: data.profileType,
      });

      setData((prev) => ({
        ...prev,
        profileSummary: result.summary,
        skills: result.skills,
        experiences: prev.experiences.map((e, idx) =>
          idx === 0
            ? { ...e, description: result.experienceBullets.join("\n") }
            : e,
        ),
      }));

      toast.success("Votre CV complet a été harmonisé par l'Intelligence Artificielle !");
    } catch (error) {
      toast.error("Impossible d'harmoniser le CV complet pour le moment.");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  /* ── Trigger PDF Download (or Open Paywall if not unlocked) ── */
  const handleDownloadClick = () => {
    if (!isUnlocked) {
      setShowPaywallModal(true);
    } else {
      executeDownloadPdf(false);
    }
  };

  /* ── Core PDF Generator ── */
  const executeDownloadPdf = async (asDemo: boolean) => {
    const safeName =
      data.fullName
        .trim()
        .replace(/[^a-zA-Z0-9À-ÿ]+/g, "-")
        .replace(/^-|-$/g, "") || "cv-tounsi";
    const filename = asDemo
      ? `${safeName}-${data.template}-demo-protege.pdf`
      : `${safeName}-${data.template}.pdf`;

    setIsExporting(true);
    setShowPaywallModal(false);
    toast.info(asDemo ? "Téléchargement de la version démo protégée..." : "Génération du PDF officiel en Haute Définition...");

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const printElement = printTargetRef.current;
      if (!printElement) {
        throw new Error("Impossible de trouver la feuille pour l'export.");
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("cv_tounsi_client_token") : null;

      // ── Server-side Paywall Verification ──
      try {
        const serverVerifyRes = await fetch("/api/pdf/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: printElement.innerHTML,
            token,
            isDemo: asDemo,
          }),
        });

        if (!serverVerifyRes.ok && !asDemo) {
          const errData = await serverVerifyRes.json().catch(() => ({}));
          toast.error(errData.error || "Code d'activation requis pour télécharger la version HD.");
          setShowPaywallModal(true);
          setIsExporting(false);
          return;
        }
      } catch {
        // Fallback for resilient offline export if token is present
      }

      const blob = await createPdfBlob(
        html2pdf() as unknown as PdfWorkerLike,
        printElement,
        {
          margin: [0, 0, 0, 0],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            backgroundColor: "#ffffff",
            windowWidth: 794,
            scrollY: 0,
            scrollX: 0,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      trackPDFDownloaded(data.template, !asDemo);

      if (asDemo) {
        toast.success("Fichier démo téléchargé ! Contactez-nous sur WhatsApp (+216 95 669 209) pour obtenir la version nette.");
      } else {
        toast.success("Votre PDF A4 officiel a été téléchargé avec succès !");
      }
    } catch (error) {
      console.error("[CV] PDF generation error", error);
      toast.error("Le téléchargement du PDF a échoué. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Form Steps Content Sub-Component (Shared by PC and Mobile) ── */
  const renderFormContent = () => (
    <>
      {/* Étape 0: Statut / Profil & Coordonnées */}
      {step === 0 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">PROFIL & SITUATION ACTUELLE</div>
          <h2>Quelle est votre situation ?</h2>
          <p className="panel-lead">
            Le modèle de CV et les conseils de l'IA s'adaptent selon que vous ayez déjà de l'expérience ou que vous soyez étudiant.
          </p>

          {/* ── Profile Type Selector (Experienced vs Student) ── */}
          <div className="profile-type-grid">
            <button
              type="button"
              className={`profile-type-card ${data.profileType === "experienced" ? "selected" : ""}`}
              onClick={() => handleSelectProfileType("experienced")}
            >
              <div className="profile-type-icon-box">
                <Briefcase size={17} />
              </div>
              <div className="profile-type-text">
                <strong>💼 Profil Expérimenté</strong>
                <p>Vous avez déjà de l'expérience professionnelle (CDI, CDD, Freelance...). Vos postes sont mis en avant.</p>
              </div>
            </button>

            <button
              type="button"
              className={`profile-type-card ${data.profileType === "student" ? "selected" : ""}`}
              onClick={() => handleSelectProfileType("student")}
            >
              <div className="profile-type-icon-box">
                <GraduationCap size={17} />
              </div>
              <div className="profile-type-text">
                <strong>🎓 Étudiant / Jeune Diplômé</strong>
                <p>En recherche de stage PFE ou 1er emploi. Vos formations, diplômes et projets d'études sont valorisés en priorité.</p>
              </div>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button
              type="button"
              style={{ fontSize: "0.72rem", color: "var(--olive-dark)", background: "transparent", textDecoration: "underline", cursor: "pointer" }}
              onClick={() => loadSample(data.profileType)}
            >
              ✦ Charger un exemple type {isStudent ? "Étudiant (PFE / Projets)" : "Professionnel Expérimenté"}
            </button>
          </div>

          <div className="panel-kicker" style={{ marginTop: "1rem" }}>COORDONNÉES PRINCIPALES</div>
          <div className="form-grid">
            <Field
              label="Nom complet"
              value={data.fullName}
              onChange={(v) => update("fullName", v)}
              placeholder="Ex. Sarra Ben Salem"
            />
            <Field
              label={isStudent ? "Intitulé du profil / Stage visé" : "Poste recherché / Titre"}
              value={data.targetRole}
              onChange={(v) => update("targetRole", v)}
              placeholder={isStudent ? "Ex. Étudiant Ingénieur (Recherche Stage PFE)" : "Ex. Marketing & Communication Specialist"}
            />
            <Field
              label="Ville & Pays"
              value={data.city}
              onChange={(v) => update("city", v)}
              icon={MapPin}
              placeholder="Ex. Tunis, Tunisie"
            />
            <Field
              label="Adresse e-mail"
              value={data.email}
              onChange={(v) => update("email", v)}
              type="email"
              icon={Mail}
              placeholder="Ex. contact@email.com"
            />
            <Field
              label="Téléphone"
              value={data.phone}
              onChange={(v) => update("phone", v)}
              icon={Phone}
              placeholder="Ex. +216 XX XXX XXX"
            />
          </div>

          <div className="field field-full">
            <div className="field-header-row">
              <span>{isStudent ? "Accroche / Objectif de stage ou carrière" : "Profil professionnel / Accroche"}</span>
              <button
                type="button"
                className="button-ai-micro"
                onClick={handleImproveProfile}
                disabled={isProfileLoading}
                title="Générer une accroche adaptée avec l'Intelligence Artificielle"
              >
                {isProfileLoading ? (
                  <>
                    <span className="button-spinner-sm" /> Génération IA...
                  </>
                ) : (
                  <>
                    <WandSparkles size={12} /> Améliorer le profil avec l'IA
                  </>
                )}
              </button>
            </div>
            <textarea
              value={data.profileSummary}
              onChange={(e) => update("profileSummary", e.target.value)}
              placeholder={isStudent ? "Présentez brièvement vos études, vos passions techniques et votre recherche de stage / premier emploi..." : "Présentez vos points forts, votre expertise et votre valeur ajoutée..."}
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Étape 1: Expériences ou Projets d'études */}
      {step === 1 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">
            {isStudent ? "PROJETS ACADÉMIQUES, STAGES & ENGAGEMENTS" : "PARCOURS PROFESSIONNEL"}
          </div>
          <h2>
            {isStudent ? "Vos projets d'études et stages." : "Vos expériences et réalisations."}
          </h2>
          <p className="panel-lead">
            {isStudent
              ? "Valorisez vos projets de fin d'année (PFE / PFA), stages d'initiation, hackathons ou activités dans les clubs étudiants."
              : "Ajoutez vos postes clés. Utilisez le bouton IA sur chaque carte pour formuler des réalisations d'impact."}
          </p>

          <div className="experiences-cards-list">
            {data.experiences.map((exp, idx) => (
              <div key={exp.id || idx} className="experience-card-box">
                <div className="experience-card-top">
                  <span className="exp-card-number">
                    {isStudent ? `Projet / Stage #${idx + 1}` : `Expérience #${idx + 1}`}
                  </span>
                  <div className="card-top-actions">
                    <button
                      type="button"
                      className="button-ai-micro"
                      onClick={() => handleImproveExperience(idx)}
                      disabled={expLoadingIdx === idx}
                      title="Valoriser avec l'IA"
                    >
                      {expLoadingIdx === idx ? (
                        <>
                          <span className="button-spinner-sm" /> Optimisation...
                        </>
                      ) : (
                        <>
                          <WandSparkles size={12} /> {isStudent ? "Améliorer ce projet (IA)" : "Améliorer cette expérience (IA)"}
                        </>
                      )}
                    </button>
                    {data.experiences.length > 1 && (
                      <button
                        type="button"
                        className="button-icon-danger"
                        onClick={() => removeExperience(idx)}
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <Field
                    label={isStudent ? "Intitulé du projet ou rôle" : "Intitulé du poste"}
                    value={exp.role}
                    onChange={(v) => updateExperience(idx, "role", v)}
                    placeholder={isStudent ? "Ex. Projet de Fin d'Année (PFA) — App Web" : "Ex. Chargée de communication"}
                  />
                  <Field
                    label={isStudent ? "Université / Établissement / Organisme" : "Entreprise"}
                    value={exp.company}
                    onChange={(v) => updateExperience(idx, "company", v)}
                    placeholder={isStudent ? "Ex. INSAT / Club IEEE" : "Ex. Studio 216"}
                  />
                  <Field
                    label="Période (Dates)"
                    value={exp.dates}
                    onChange={(v) => updateExperience(idx, "dates", v)}
                    placeholder="Ex. 2023 — 2024"
                  />
                  <Field
                    label="Lieu (Ville, Pays)"
                    value={exp.location || ""}
                    onChange={(v) => updateExperience(idx, "location", v)}
                    placeholder="Ex. Tunis, Tunisie"
                  />
                </div>

                <label className="field field-full">
                  <span>
                    {isStudent
                      ? "Description du projet, technologies utilisées & résultats (une puce par ligne)"
                      : "Missions & réalisations (une par ligne)"}
                  </span>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(idx, "description", e.target.value)}
                    placeholder={isStudent ? "• Conception et développement de l'architecture avec React...\n• Déploiement Docker et soutenance devant le jury..." : "• Gestion du contenu digital...\n• Déploiement de 15 campagnes..."}
                    rows={4}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="add-item-row">
            <button type="button" className="button button-quiet-add" onClick={addExperience}>
              <Plus size={16} /> {isStudent ? "Ajouter un autre projet / stage" : "Ajouter une autre expérience"}
            </button>
          </div>
        </div>
      )}

      {/* Étape 2: Formation & Compétences */}
      {step === 2 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">FORMATION & SAVOIR-FAIRE</div>
          <h2>Diplômes, compétences et langues.</h2>
          <p className="panel-lead">
            {isStudent
              ? "Votre formation académique est au cœur de votre CV. Détaillez vos études supérieures et votre baccalauréat."
              : "Détaillez vos formations universitaires et générez vos compétences clés avec l'Intelligence Artificielle."}
          </p>

          <div className="section-subheading">
            <GraduationCap size={16} /> Formations & Diplômes
          </div>
          <div className="experiences-cards-list">
            {data.educations.map((edu, idx) => (
              <div key={edu.id || idx} className="experience-card-box">
                <div className="experience-card-top">
                  <span className="exp-card-number">Diplôme #{idx + 1}</span>
                  {data.educations.length > 1 && (
                    <button
                      type="button"
                      className="button-icon-danger"
                      onClick={() => removeEducation(idx)}
                      title="Supprimer cette formation"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <Field
                    label="Diplôme / Titre obtenu"
                    value={edu.degree}
                    onChange={(v) => updateEducation(idx, "degree", v)}
                    placeholder="Ex. Diplôme National d'Ingénieur en Informatique"
                  />
                  <Field
                    label="Établissement / Université"
                    value={edu.school}
                    onChange={(v) => updateEducation(idx, "school", v)}
                    placeholder="Ex. Institut National des Sciences Appliquées (INSAT)"
                  />
                  <Field
                    label="Année d'obtention (ou En cours)"
                    value={edu.year}
                    onChange={(v) => updateEducation(idx, "year", v)}
                    placeholder="Ex. 2021 — 2026"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="add-item-row">
            <button type="button" className="button button-quiet-add" onClick={addEducation}>
              <Plus size={16} /> Ajouter une autre formation
            </button>
          </div>

          <div className="section-subheading" style={{ marginTop: "1.8rem" }}>
            <Sparkles size={16} /> Compétences Clés & Outils
          </div>
          <div className="field field-full">
            <div className="field-header-row">
              <span>Liste de compétences (séparées par « · »)</span>
              <button
                type="button"
                className="button-ai-micro"
                onClick={handleImproveSkills}
                disabled={isSkillsLoading}
                title="Suggérer les compétences adaptées avec l'IA"
              >
                {isSkillsLoading ? (
                  <>
                    <span className="button-spinner-sm" /> Recherche IA...
                  </>
                ) : (
                  <>
                    <WandSparkles size={12} /> Suggérer compétences (IA)
                  </>
                )}
              </button>
            </div>
            <textarea
              value={data.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder="Ex. React · TypeScript · Python · Git · Docker · Travail en équipe"
              rows={3}
            />
          </div>

          <div className="section-subheading" style={{ marginTop: "1.5rem" }}>
            <Globe size={16} /> Langues Pratiquées
          </div>
          <label className="field field-full">
            <span>Langues & niveaux (séparées par « · »)</span>
            <input
              type="text"
              value={data.languagesList}
              onChange={(e) => update("languagesList", e.target.value)}
              placeholder="Ex. Arabe (Maternelle) · Français (Bilingue) · Anglais (Courant)"
            />
          </label>
        </div>
      )}

      {/* Étape 3: Modèle & Langue */}
      {step === 3 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">MODÈLE & LANGUE D'EXPORT</div>
          <h2>Choisissez votre présentation visuelle.</h2>
          <p className="panel-lead">
            {isStudent
              ? "Les modèles sont automatiquement structurés pour valoriser votre formation et vos projets d'études."
              : "3 formats professionnels conçus pour maximiser l'impact de votre parcours."}
          </p>

          <div className="ai-step-banner">
            <div className="ai-step-banner-icon">
              <WandSparkles size={20} />
            </div>
            <div className="ai-step-banner-text">
              <strong>Harmonisation Globale par l'IA</strong>
              <p>Harmonisez automatiquement les textes, mots-clés et tournures de phrases pour votre profil {isStudent ? "étudiant" : "professionnel"}.</p>
            </div>
            <button
              type="button"
              className="button ai-button"
              onClick={improveCopy}
              disabled={isGlobalLoading}
            >
              {isGlobalLoading ? "Harmonisation..." : "Harmoniser (IA)"}
            </button>
          </div>

          <div className="option-section">
            <div className="option-heading">
              <span>Sélectionnez le Modèle de CV</span>
              <small>{templateCatalog[data.template].badge}</small>
            </div>
            <div className="template-options-vertical">
              {(Object.entries(templateCatalog) as [TemplateId, TemplateMeta][]).map(
                ([id, template]) => (
                  <button
                    key={id}
                    type="button"
                    className={`template-option-card ${data.template === id ? "selected" : ""}`}
                    onClick={() => selectTemplate(id)}
                  >
                    <div className="template-card-preview-mini">
                      <TemplateMini template={id} />
                    </div>
                    <div className="template-card-info">
                      <div className="template-card-title-row">
                        <strong>{template.label}</strong>
                        <span className="template-badge-tag">{template.badge}</span>
                      </div>
                      <p>{template.description}</p>
                      <div className="template-card-langs">
                        Langues supportées :{" "}
                        {template.languages
                          .map((l) => languageLabels[l].native)
                          .join(" · ")}
                      </div>
                    </div>
                    <div className="template-radio-circle" />
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="option-section" style={{ marginTop: "2rem" }}>
            <div className="option-heading">
              <span>Langue du CV</span>
              <small>{templateCatalog[data.template].languages.length} langue(s) disponible(s)</small>
            </div>
            <div className="language-options">
              {templateCatalog[data.template].languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={data.language === lang ? "selected" : ""}
                  onClick={() => {
                    setData((prev) => ({ ...prev, language: lang }));
                  }}
                >
                  <Languages size={16} />
                  <b>{languageLabels[lang].name}</b>
                  <small>{languageLabels[lang].native} · Traduction auto des rubriques</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <main className="builder-shell">
      {/* ── Hidden Dedicated 794px Print Target for html2pdf ── */}
      <div
        id="cv-pdf-render-target"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "794px",
          background: "#ffffff",
          zIndex: isExporting ? 99999 : -99999,
          opacity: isExporting ? 1 : 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <div ref={printTargetRef} style={{ width: "794px", background: "#ffffff", position: "relative" }}>
          <div className={!isUnlocked ? "pdf-blurred-sheet" : ""}>
            <ResumePreview
              data={data}
              editable={false}
            />
          </div>

          {/* Paywall Protection Badge centered on the blurred PDF when not unlocked */}
          {!isUnlocked && (
            <div className="pdf-paywall-badge-card">
              <div className="pdf-paywall-icon">
                <Lock size={26} />
              </div>
              <h2>🔒 VERSION DÉMO PROTÉGÉE — CV TOUNSI</h2>
              <p>
                Ce document est un extrait protégé de démonstration. Pour recevoir votre <b>CV complet en Haute Définition</b> (sans flou et sans filigrane) :
              </p>
              <div className="pdf-paywall-box-highlight">
                <div className="price-row">Tarif Déblocage : 19 TND</div>
                <div className="whatsapp-num">WhatsApp : +216 95 669 209</div>
              </div>
              <div className="pdf-paywall-instructions">
                Envoyez un message sur WhatsApp avec votre nom pour obtenir instantanément votre fichier PDF certifié sans restriction.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Paywall & Monetization Modal ── */}
      {showPaywallModal && (
        <div className="paywall-modal-backdrop" onClick={() => setShowPaywallModal(false)}>
          <div className="paywall-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="paywall-modal-header">
              <div>
                <h3>Débloquez votre CV en Haute Définition</h3>
                <p>Recevez votre code d'activation pour exporter le PDF A4 net sans flou</p>
              </div>
              <button
                type="button"
                className="paywall-modal-close-btn"
                onClick={() => setShowPaywallModal(false)}
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="paywall-modal-body">
              <div className="paywall-pricing-card">
                <div className="paywall-pricing-left">
                  <strong>Formule Complète (PDF A4 Haute Définition)</strong>
                  <span>Accès définitif · Sans flou · Sans filigrane</span>
                </div>
                <div className="paywall-price-badge">19 TND</div>
              </div>

              {/* Step 1: WhatsApp CTA */}
              <div style={{ marginBottom: "0.9rem" }}>
                <span style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>
                  1. Commandez votre code d'activation sur WhatsApp :
                </span>
                <a
                  href={`https://wa.me/21695669209?text=Bonjour,%20je%20souhaite%20recevoir%20le%20code%20de%20d%C3%A9blocage%20pour%20mon%20CV%20Tounsi%20(19%20TND).%20Nom:%20${encodeURIComponent(data.fullName)}%20-%20Code%20sugg%C3%A9r%C3%A9:%20${encodeURIComponent(generateSuggestedCode(data.fullName))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-action-btn"
                  onClick={() => trackWhatsAppClicked(generateSuggestedCode(data.fullName))}
                >
                  <MessageCircle size={18} />
                  <span>Obtenir mon code sur WhatsApp (+216 95 669 209)</span>
                </a>
                <div style={{ fontSize: "0.71rem", color: "var(--olive-dark)", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>💡 Code mémorisable généré pour vous :</span>
                  <strong style={{ background: "#e8f0e6", padding: "1px 6px", borderRadius: "4px", letterSpacing: "0.04em" }}>
                    {generateSuggestedCode(data.fullName)}
                  </strong>
                </div>
              </div>

              {/* Step 2: Enter Client Activation Code */}
              <div className="client-unlock-box">
                <div className="client-unlock-title">
                  <Key size={14} /> 2. Vous avez reçu votre code ? Entrez-le ici :
                </div>
                <p className="client-unlock-desc">
                  Saisissez votre code pour débloquer immédiatement votre CV en qualité maximale.
                </p>

                <form onSubmit={handleUnlockWithClientCode} className="client-unlock-form">
                  <input
                    type="text"
                    className="client-unlock-input"
                    placeholder={`Ex: ${generateSuggestedCode(data.fullName)} ou TN-19...`}
                    value={clientCodeInput}
                    onChange={(e) => setClientCodeInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="client-unlock-btn">
                    Activer & Télécharger HD
                  </button>
                </form>
              </div>

              {/* Download Free Blurred Demo Button */}
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="download-demo-btn"
                  onClick={() => executeDownloadPdf(true)}
                >
                  <Download size={14} />
                  <span>Télécharger un extrait d'essai (flouté)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Top Bar with Device Switcher (PC / Mobile Parallel Modes) ── */}
      <div className="builder-topbar">
        <div className="builder-topbar-inner">
          <button className="back-link" onClick={onBack}>
            <ChevronLeft size={16} /> Accueil
          </button>

          <div className="builder-brand-bar">
            <span className="brand-mark small-mark" aria-hidden="true" />
            <span>
              CV <b>Tounsi</b>
            </span>
          </div>

          {/* ── Parallel Device Mode Switcher ── */}
          <div className="device-toggle-bar" title="Basculer entre la vue Ordinateur (PC) et la vue Téléphone (Mobile)">
            <button
              type="button"
              className={`device-toggle-btn ${deviceMode === "desktop" ? "active" : ""}`}
              onClick={() => setDeviceMode("desktop")}
            >
              <Monitor size={14} /> Mode PC
            </button>
            <button
              type="button"
              className={`device-toggle-btn ${deviceMode === "mobile" ? "active" : ""}`}
              onClick={() => setDeviceMode("mobile")}
            >
              <Smartphone size={14} /> Mode Téléphone
            </button>
          </div>

          <div className="builder-topbar-actions">
            {/* User Account / Save Button */}
            <button
              type="button"
              className="button button-quiet"
              onClick={handleSaveToCloud}
              disabled={isSavingCloud}
              title={user ? "Sauvegarder les modifications de votre CV dans votre compte" : "Connectez-vous pour sauvegarder votre CV en ligne"}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}
            >
              {isSavingCloud ? (
                <>
                  <span className="button-spinner-sm" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Cloud size={14} className={user ? "text-emerald-600" : "text-stone-400"} />
                  <span>{user ? "Sauvegarder" : "Sauvegarder (Cloud)"}</span>
                </>
              )}
            </button>

            {user && (
              <button
                type="button"
                className="button button-quiet"
                onClick={onOpenSavedCvs}
                title="Consulter et gérer vos CVs enregistrés"
                style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.78rem" }}
              >
                <FolderOpen size={14} />
                <span>Mes CVs</span>
                {savedCvs.length > 0 && (
                  <span style={{ background: "#2d6a4f", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: "bold" }}>
                    {savedCvs.length}
                  </span>
                )}
              </button>
            )}

            {/* Client Status Badge or Unlock Trigger */}
            {isUnlocked ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="unlocked-success-badge" title="Votre CV est débloqué en Haute Définition">
                  <Check size={12} /> Version HD Débloquée
                </span>
                <button
                  type="button"
                  onClick={handleRelockForTest}
                  style={{
                    background: "none",
                    border: "0",
                    color: "#c7d2c0",
                    fontSize: "0.64rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  title="Réinitialiser pour tester le mode verrouillé"
                >
                  (Test)
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button ai-button"
                onClick={() => setShowPaywallModal(true)}
                title="Débloquer la version complète sans flou"
              >
                <Key size={13} />
                <span>Débloquer HD (19 TND)</span>
              </button>
            )}

            <button
              className="button ai-button"
              onClick={improveCopy}
              disabled={isGlobalLoading}
            >
              {isGlobalLoading ? (
                <>
                  <span className="button-spinner" /> Optimisation...
                </>
              ) : (
                <>
                  <WandSparkles size={15} /> Harmoniser IA
                </>
              )}
            </button>
            <button className="button button-primary" onClick={handleDownloadClick} disabled={isExporting}>
              {isExporting ? (
                <>
                  <span className="button-spinner" /> Export...
                </>
              ) : (
                <>
                  <Download size={15} /> Télécharger PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         MODE 1: PC / DESKTOP (3-Column Layout with Sticky Live Large Preview)
         ════════════════════════════════════════════════════════════════════════ */}
      {deviceMode === "desktop" ? (
        <div className="builder-layout-fluid">
          {/* Column 1: Left Stepper */}
          <aside className="builder-sidebar">
            <div className="builder-intro">
              <div className="eyebrow">
                ÉTAPE 0{step + 1} / 04
              </div>
              <h1>{steps[step].label}</h1>
              <p>{steps[step].caption}</p>
            </div>

            <div className="stepper" aria-label="Étapes de création du CV">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const current = index === step;
                const done = index < step;
                return (
                  <button
                    key={item.label}
                    className={`stepper-item ${current ? "current" : ""} ${done ? "done" : ""}`}
                    onClick={() => setStep(index as BuilderStep)}
                  >
                    <span className="step-icon">
                      {done ? <Check size={14} /> : <Icon size={14} />}
                    </span>
                    <span>
                      <b>{item.label}</b>
                      <small>{item.caption}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="privacy-note">
              <span className="privacy-lock">✦</span>
              <p>
                <strong>Profil :</strong> {isStudent ? "Étudiant / Jeune Diplômé" : "Professionnel Expérimenté"}
                <br />
                <strong>Statut :</strong> {isUnlocked ? "✅ Haute Définition Activée" : "🔒 Version Démo (19 TND)"}
              </p>
            </div>
          </aside>

          {/* Column 2: Form Panel */}
          <section className="builder-form">
            {renderFormContent()}

            <div className="form-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={goPrev}
                disabled={step === 0}
              >
                {step > 0 ? (
                  <>
                    <ChevronLeft size={16} /> Précédent
                  </>
                ) : (
                  ""
                )}
              </button>

              {step < 3 ? (
                <button type="button" className="button button-primary" onClick={goNext}>
                  Continuer <ArrowLeft size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleDownloadClick}
                  disabled={isExporting}
                >
                  <Download size={16} /> Télécharger mon CV (PDF A4)
                </button>
              )}
            </div>
          </section>

          {/* Column 3: Large Sticky Live Preview */}
          <section className="builder-preview">
            <div className="preview-stage-container">
              <ScaledResumePreview
                data={data}
                onFieldChange={(updater) => setData(updater)}
                editable={true}
                isMobileMode={false}
                isUnlocked={isUnlocked}
                isScreenProtected={isScreenProtected}
                onOpenPaywall={() => setShowPaywallModal(true)}
              />
            </div>
          </section>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
           MODE 2: SMARTPHONE / MOBILE (Dedicated Mobile UI & Phone Mockup)
           ════════════════════════════════════════════════════════════════════════ */
        <div className="phone-mode-wrapper">
          <div className="phone-mockup-device">
            {/* Smartphone Notch / Island */}
            <div className="phone-notch-island">
              <div className="phone-camera-lens" />
            </div>

            {/* Mobile Top Segmented Tabs: Formulaire vs Aperçu */}
            <div className="mobile-view-tabs">
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === "form" ? "active" : ""}`}
                onClick={() => setMobileTab("form")}
              >
                <Edit3 size={14} /> Formulaire (Étape 0{step + 1})
              </button>
              <button
                type="button"
                className={`mobile-tab-btn ${mobileTab === "preview" ? "active" : ""}`}
                onClick={() => setMobileTab("preview")}
              >
                <Eye size={14} /> Aperçu Live du CV
              </button>
            </div>

            {/* Mobile 4-Step Pills */}
            <div className="mobile-step-pills">
              {steps.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`mobile-step-pill ${step === idx ? "active" : ""} ${idx < step ? "done" : ""}`}
                  onClick={() => {
                    setStep(idx as BuilderStep);
                    setMobileTab("form");
                  }}
                >
                  <span className="mobile-step-pill-num">0{idx + 1}</span>
                  <span className="mobile-step-pill-title">{item.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Mobile Tab 1: Formulaire */}
            {mobileTab === "form" && (
              <div className="mobile-form-container">
                {renderFormContent()}

                {/* Mobile Floating Bottom Bar */}
                <div className="mobile-floating-bar">
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => setMobileTab("preview")}
                  >
                    <Eye size={15} /> Voir CV
                  </button>

                  {step < 3 ? (
                    <button type="button" className="button button-primary" onClick={goNext}>
                      Suivant <ArrowLeft size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleDownloadClick}
                      disabled={isExporting}
                    >
                      <Download size={15} /> PDF A4
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Tab 2: Aperçu Live du CV */}
            {mobileTab === "preview" && (
              <div className="mobile-preview-container">
                <ScaledResumePreview
                  data={data}
                  onFieldChange={(updater) => setData(updater)}
                  editable={true}
                  isMobileMode={true}
                  isUnlocked={isUnlocked}
                  isScreenProtected={isScreenProtected}
                  onOpenPaywall={() => setShowPaywallModal(true)}
                />

                {/* Mobile Floating Bottom Bar */}
                <div className="mobile-floating-bar">
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => setMobileTab("form")}
                  >
                    <Edit3 size={15} /> Éditer infos
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={handleDownloadClick}
                    disabled={isExporting}
                  >
                    <Download size={15} /> Télécharger PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const { user, openAuthModal, logout, savedCvs } = useAuth();
  const [isBuilder, setIsBuilder] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [data, setData] = useState<CvData>(initialData);
  const [activeCvId, setActiveCvId] = useState<number | null>(null);
  const [isSavedCvsOpen, setIsSavedCvsOpen] = useState(false);

  const startBuilder = () => {
    trackBuilderStarted(data.template, data.language);
    setIsBuilder(true);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadCv = (savedCv: SavedCvItem) => {
    try {
      const parsed = JSON.parse(savedCv.dataJson);
      setData(parsed);
      setActiveCvId(savedCv.id);
      setIsBuilder(true);
      toast.success(`CV "${savedCv.title}" chargé dans l'éditeur.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Erreur lors du chargement des données du CV.");
    }
  };

  const handleNewCv = () => {
    setData(initialData);
    setActiveCvId(null);
    setIsBuilder(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      {!isBuilder && (
        <header className="site-header">
          <div className="container header-inner">
            <button
              className="brand"
              onClick={() => scrollToId("top")}
              aria-label="Retour au début"
            >
              <span className="brand-mark" aria-hidden="true" />
              <span>
                 CV <b>Tounsi</b>
              </span>
            </button>
            <nav className={mobileNav ? "mobile-open" : ""}>
              <button
                onClick={() => {
                  scrollToId("templates");
                  setMobileNav(false);
                }}
              >
                Nos Modèles
              </button>
              <button
                onClick={() => {
                  toast.info("CV Tounsi est optimisé pour les candidatures en Tunisie et à l'international (Profils Expérimentés & Étudiants).");
                  setMobileNav(false);
                }}
              >
                Formats ATS & UE
              </button>
              {user && (
                <button
                  onClick={() => {
                    setIsSavedCvsOpen(true);
                    setMobileNav(false);
                  }}
                  className="font-semibold text-emerald-800"
                >
                  Mes CVs ({savedCvs.length})
                </button>
              )}
            </nav>
            <div className="header-actions">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSavedCvsOpen(true)}
                    className="button button-quiet"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}
                    title="Ouvrir mes CVs sauvegardés"
                  >
                    <FolderOpen size={15} className="text-emerald-700" />
                    <span>Mes CVs</span>
                    {savedCvs.length > 0 && (
                      <span style={{ background: "#2d6a4f", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "0.68rem", fontWeight: "bold" }}>
                        {savedCvs.length}
                      </span>
                    )}
                  </button>
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
                    <UserIcon size={12} className="text-emerald-700" />
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="button button-quiet"
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.75rem", color: "#888" }}
                    title="Se déconnecter"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="button button-quiet"
                  style={{ fontSize: "0.82rem" }}
                >
                  <UserIcon size={14} />
                  <span>Connexion</span>
                </button>
              )}

              <button className="header-cta" onClick={startBuilder}>
                Créer mon CV <ArrowLeft size={15} />
              </button>
              <button
                className="menu-toggle"
                onClick={() => setMobileNav((val) => !val)}
                aria-label="Menu"
              >
                {mobileNav ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </header>
      )}

      <div id="top">
        {isBuilder ? (
          <Builder
            data={data}
            setData={setData}
            onBack={() => setIsBuilder(false)}
            activeCvId={activeCvId}
            setActiveCvId={setActiveCvId}
            onOpenSavedCvs={() => setIsSavedCvsOpen(true)}
          />
        ) : (
          <Landing onStart={startBuilder} />
        )}
      </div>

      <UserSavedCvsModal
        isOpen={isSavedCvsOpen}
        onClose={() => setIsSavedCvsOpen(false)}
        onLoadCv={handleLoadCv}
        onNewCv={handleNewCv}
      />

      {!isBuilder && (
        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="brand footer-brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>
                CV <b>Tounsi</b>
              </span>
            </div>
            <p>De Tunis, vers votre prochaine étape professionnelle.</p>
            <div className="footer-links" style={{ display: "flex", gap: "1.5rem", justifyContent: "center", fontSize: "0.85rem", margin: "0.75rem 0" }}>
              <Link href="/politique-de-confidentialite" className="footer-link hover:underline text-[#60735A]">
                Politique de Confidentialité
              </Link>
              <Link href="/conditions-utilisation" className="footer-link hover:underline text-[#60735A]">
                Conditions d'Utilisation
              </Link>
            </div>
            <span>© 2026 CV Tounsi — Tous droits réservés</span>
          </div>
        </footer>
      )}
    </div>
  );
}
