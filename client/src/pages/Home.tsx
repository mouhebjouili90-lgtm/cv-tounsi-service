/* CV Tounsi — Expérience duale complète : Profils Expérimentés & Étudiants / Jeunes Diplômés + Version PC & Mobile en parallèle. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { createPdfBlob, type PdfWorkerLike } from "@/lib/pdf";
import {
  improveProfileWithGemini,
  improveExperienceWithGemini,
  improveSkillsWithGemini,
  improveLanguagesWithGemini,
  improveFullCvWithGemini,
  type ProfileType,
} from "@/lib/gemini";
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
import { generateSuggestedCode, getSubscriptionStatus } from "@/lib/activation";
import {
  ArrowLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  Download,
  FileText,
  Languages,
  LayoutGrid,
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
  ShieldCheck,
  Star,
  Zap,
  CreditCard,
  Crown,
  Key,
  KeyRound,
  MessageCircle,
  User as UserIcon,
  Cloud,
  FolderOpen,
  LogOut,
  Save,
} from "lucide-react";

const heroImage = "/manus-storage/cv-tounsi-hero-reference_82281e8d.jpg";

export type TemplateCategory = "all" | "professional" | "canadian" | "europass";

export type TemplateId =
  | "professional_executive"
  | "professional_modern"
  | "professional_compact"
  | "canadian_classic"
  | "canadian_modern"
  | "canadian_executive"
  | "europass_classic"
  | "europass_modern"
  | "europass_academic"
  | "professional"
  | "canadian"
  | "europass";

export const isProOnlyTemplate = (template: string): boolean => {
  return (
    template === "professional_executive" ||
    template === "canadian_executive" ||
    template === "europass_academic" ||
    template === "professional"
  );
};

export type Language = "fr" | "en" | "de" | "it" | "ar";
export type BuilderStep = 0 | 1 | 2 | 3;

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
  id: TemplateId;
  category: "professional" | "canadian" | "europass";
  label: string;
  eyebrow: string;
  description: string;
  short: string;
  badge: string;
  complianceNote: string;
  languages: Language[];
};

export const templateCatalog: Record<string, TemplateMeta> = {
  professional_executive: {
    id: "professional_executive",
    category: "professional",
    label: "Professionnel Exécutif",
    eyebrow: "MODÈLE EXÉCUTIF OLIVE",
    description: "Design 2 colonnes raffiné avec bannière olive, barre latérale structurée et timeline détaillée.",
    short: "2 Colonnes · Cadre & International",
    badge: "Exécutif & Moderne",
    complianceNote: "Structure 2 colonnes équilibrée",
    languages: ["fr", "en", "de", "it", "ar"],
  },
  professional_modern: {
    id: "professional_modern",
    category: "professional",
    label: "Professionnel Moderne Slate",
    eyebrow: "MODÈLE ARDOISE & BLEU NUIT",
    description: "Header contemporain épuré, ligne d'accent bleu nuit, typographie moderne et hiérarchie claire.",
    short: "2 Colonnes · Contemporain",
    badge: "Corporate & Tech",
    complianceNote: "Hiérarchie visuelle premium",
    languages: ["fr", "en", "de", "it", "ar"],
  },
  professional_compact: {
    id: "professional_compact",
    category: "professional",
    label: "Professionnel Tech & Startup",
    eyebrow: "SIDEBAR SOMBRE & DIGITAL",
    description: "Sidebar gauche sombre pleine hauteur mettant en avant les compétences avec timeline moderne.",
    short: "Sidebar Sombre · Tech & Digital",
    badge: "Startup & Digital",
    complianceNote: "Mise en avant des compétences clés",
    languages: ["fr", "en", "de", "it", "ar"],
  },
  canadian_classic: {
    id: "canadian_classic",
    category: "canadian",
    label: "Canadien Classique ATS",
    eyebrow: "MODÈLE CANADIEN ATS CERTIFIÉ",
    description: "Format nord-américain 1 colonne épuré, centré, sans photo, optimisé pour les filtres ATS des recruteurs.",
    short: "1 Colonne · 100% Conforme ATS",
    badge: "Standard Canada & USA",
    complianceNote: "100% Conforme ATS Taleo & Workday / Anti-discrimination",
    languages: ["fr", "en"],
  },
  canadian_modern: {
    id: "canadian_modern",
    category: "canadian",
    label: "Canadien Structuré ATS",
    eyebrow: "NORD-AMÉRICAIN STRUCTURÉ",
    description: "Format 1 colonne avec bandeaux de rubriques discrets gris clair et alignement rigoureux.",
    short: "1 Colonne · Structuré ATS",
    badge: "Ingénierie & Finance",
    complianceNote: "Parsing ATS et hiérarchie chronologique",
    languages: ["fr", "en"],
  },
  canadian_executive: {
    id: "canadian_executive",
    category: "canadian",
    label: "Canadien Senior Exécutif",
    eyebrow: "EXÉCUTIF NORD-AMÉRICAIN",
    description: "Format cadre supérieur nord-américain avec bloc de compétences clés en grille textuelle 3 colonnes.",
    short: "1 Colonne · Senior & Direction",
    badge: "Senior & Management",
    complianceNote: "Normes nord-américaines de direction",
    languages: ["fr", "en"],
  },
  europass_classic: {
    id: "europass_classic",
    category: "europass",
    label: "Europass Officiel Bleu UE",
    eyebrow: "MODÈLE OFFICIEL EUROPASS UE",
    description: "Structure européenne officielle en grille asymétrique avec bandeau bleu UE et logo Europass.",
    short: "Grille Asymétrique · Standard UE",
    badge: "Union Européenne",
    complianceNote: "Format officiel de la Commission Européenne",
    languages: ["fr", "en", "de", "it"],
  },
  europass_modern: {
    id: "europass_modern",
    category: "europass",
    label: "Europass Épuré Moderne",
    eyebrow: "EUROPÉEN MINIMALISTE",
    description: "Version allégée et modernisée du format européen sans bordures rigides avec timeline soignée.",
    short: "Asymétrique · Épuré EU",
    badge: "Mobilité Européenne",
    complianceNote: "Respecte l'ordre normalisé européen",
    languages: ["fr", "en", "de", "it"],
  },
  europass_academic: {
    id: "europass_academic",
    category: "europass",
    label: "Europass Académique & Recherche",
    eyebrow: "UNIVERSITAIRE & BOURSES UE",
    description: "Conçu pour universitaires, thèses, bourses Erasmus et recherche internationale.",
    short: "Académique & Mobilité UE",
    badge: "Recherche & Erasmus",
    complianceNote: "Valorisation diplômes, certifications et recherche",
    languages: ["fr", "en", "de", "it"],
  },
};

// Aliases pour rétrocompatibilité
(templateCatalog as any).professional = templateCatalog.professional_executive;
(templateCatalog as any).canadian = templateCatalog.canadian_classic;
(templateCatalog as any).europass = templateCatalog.europass_classic;

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

export const blankCvData: CvData = {
  profileType: "experienced",
  fullName: "",
  targetRole: "",
  city: "",
  email: "",
  phone: "",
  profileSummary: "",
  experiences: [
    {
      id: "exp-1",
      role: "",
      company: "",
      dates: "",
      location: "",
      description: "",
    },
  ],
  educations: [
    {
      id: "edu-1",
      degree: "",
      school: "",
      year: "",
      location: "",
    },
  ],
  skills: "",
  languagesList: "",
  language: "fr",
  template: "professional_executive",
};

export const initialData: CvData = blankCvData;

export const showcaseSampleData: CvData = {
  profileType: "experienced",
  fullName: "Mohamed Trabelsi",
  targetRole: "Marketing & Communication Specialist",
  city: "Tunis, Tunisie",
  email: "m.trabelsi@email.com",
  phone: "+216 22 345 678",
  profileSummary:
    "Spécialiste opérationnel en marketing digital et communication stratégique combinant vision créative et rigueur analytique. Fort de plusieurs années d'expérience dans le pilotage de campagnes multicanales, l'optimisation des conversions et le rayonnement de marques innovantes.",
  experiences: [
    {
      id: "exp-1",
      role: "Responsable Communication & Marketing",
      company: "Studio Digital 216",
      dates: "2022 — Présent",
      location: "Tunis, Tunisie",
      description:
        "• Gestion globale de la stratégie de contenu digital sur les réseaux sociaux.\n• Coordination et déploiement de 15+ campagnes publicitaires annuelles avec ROI mesurable.\n• Suivi des indicateurs clés (KPIs) et amélioration de 35% de l'engagement d'audience.\n• Rédaction de communiqués de presse et relations médias.",
    },
    {
      id: "exp-2",
      role: "Assistant Marketing Digital",
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
  template: "professional_executive",
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
  { label: "Modèle & design", caption: "9 modèles conformes", icon: LayoutGrid },
  { label: "Vos informations", caption: "Identité & profil IA", icon: PenLine },
  { label: "Parcours & projets", caption: "Expériences & missions", icon: Briefcase },
  { label: "Savoir-faire & export", caption: "Compétences & PDF HD", icon: GraduationCap },
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

  const variantClass =
    data.template === "professional_modern"
      ? "prof-variant-modern"
      : data.template === "professional_compact"
      ? "prof-variant-compact"
      : "prof-variant-executive";

  return (
    <div className={`a4-sheet resume-professional-layout ${variantClass}`} dir={data.language === "ar" ? "rtl" : "ltr"}>
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
                {(data.languagesList || "").split(/[·,،\n]/).map((s) => s.trim()).filter(Boolean).map((lang, idx) => (
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

  const variantClass =
    data.template === "canadian_modern"
      ? "can-variant-modern"
      : data.template === "canadian_executive"
      ? "can-variant-executive"
      : "can-variant-classic";

  return (
    <div className={`a4-sheet resume-canadian-layout ${variantClass}`} dir={data.language === "ar" ? "rtl" : "ltr"}>
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

  const variantClass =
    data.template === "europass_modern"
      ? "euro-variant-modern"
      : data.template === "europass_academic"
      ? "euro-variant-academic"
      : "euro-variant-classic";

  return (
    <div className={`a4-sheet resume-europass-layout ${variantClass}`} dir={data.language === "ar" ? "rtl" : "ltr"}>
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
  const tId = data.template || "professional_executive";

  if (tId.startsWith("canadian")) {
    return (
      <CanadianTemplate
        data={data}
        onFieldChange={onFieldChange}
        editable={editable}
      />
    );
  }

  if (tId.startsWith("europass")) {
    return (
      <EuropassTemplate
        data={data}
        onFieldChange={onFieldChange}
        editable={editable}
      />
    );
  }

  return (
    <ProfessionalTemplate
      data={data}
      onFieldChange={onFieldChange}
      editable={editable}
    />
  );
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
        const availableWidth = wrapperRef.current.clientWidth - (isMobileMode ? 16 : 30);
        const availableHeight = (wrapperRef.current.clientHeight || (window.innerHeight - 130)) - 30;
        const scaleW = availableWidth > 0 ? availableWidth / 794 : 0.85;
        const scaleH = availableHeight > 0 ? availableHeight / 1123 : 0.85;
        const targetScale = isMobileMode ? scaleW : Math.min(scaleW, Math.max(scaleH, 0.65));
        const minScale = isMobileMode ? 0.35 : 0.60;
        const maxScale = isMobileMode ? 0.85 : 1.15;
        const newScale = Math.min(Math.max(targetScale, minScale), maxScale);
        setAutoScale(Math.round(newScale * 100) / 100);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMode]);

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const lastTapTimeRef = useRef<number>(0);

  const zoomIn = () => {
    setManualZoom((prev) => {
      const base = prev ?? autoScale;
      return Math.min(Math.round((base + 0.15) * 100) / 100, 1.6);
    });
  };

  const zoomOut = () => {
    setManualZoom((prev) => {
      const base = prev ?? autoScale;
      return Math.max(Math.round((base - 0.15) * 100) / 100, 0.35);
    });
  };

  const resetZoom = () => {
    setManualZoom(null);
  };

  const setFixedZoom = (val: number) => {
    setManualZoom(val);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = currentScale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 320) {
        // Double-tap zooms in to 100% or resets to auto
        setManualZoom((prev) => (prev && prev > 0.9 ? null : 1.0));
      }
      lastTapTimeRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const factor = dist / touchStartDistRef.current;
      const targetZoom = Math.min(Math.max(touchStartZoomRef.current * factor, 0.35), 1.6);
      setManualZoom(Math.round(targetZoom * 100) / 100);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
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
        </div>

        <div className="zoom-buttons-group">
          <button type="button" onClick={zoomOut} className="zoom-btn" title="Dézoomer (-15%)">
            <ZoomOut size={13} />
          </button>
          <span className="zoom-percentage-badge">{Math.round(currentScale * 100)}%</span>
          <button type="button" onClick={zoomIn} className="zoom-btn" title="Zoomer (+15%)">
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
          
          <button
            type="button"
            onClick={() => setFixedZoom(manualZoom === 1.0 ? 0.85 : 1.0)}
            className={`zoom-preset-btn ${manualZoom === 1.0 ? "active" : ""}`}
            title="Agrandir en taille réelle pour éditer directement les textes"
          >
            {isMobileMode ? (manualZoom === 1.0 ? "100% (Actif)" : "100% Édition") : "100%"}
          </button>
          {!isMobileMode && (
            <button
              type="button"
              onClick={() => setFixedZoom(0.85)}
              className={`zoom-preset-btn ${manualZoom === 0.85 ? "active" : ""}`}
            >
              85%
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Stage Viewport ── */}
      <div
        ref={wrapperRef}
        className="preview-scrollable-viewport"
        style={{ position: "relative", touchAction: "pan-x pan-y pinch-zoom" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Anti-Screenshot Shield Overlay */}
        {!isUnlocked && isScreenProtected && (
          <div className="screen-blur-guard-overlay">
            <ShieldAlert size={40} color="#e1b0a6" />
            <h4>🛡️ Aperçu Protégé — CV Tounsi</h4>
            <p>
              Les captures d'écran sont désactivées sur cette version d'aperçu.<br />
              Obtenez votre CV officiel en PDF haute résolution A4.
            </p>
            <button
              type="button"
              className="button button-primary"
              onClick={onOpenPaywall}
              style={{ fontSize: "0.78rem", padding: "0.5rem 1.1rem" }}
            >
              Débloquer la version officielle HD
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
  if (template === "canadian_modern") {
    return (
      <div className="mini-paper canadian-mini">
        <div className="mini-title-center" />
        <div className="mini-rule-boxed" />
        <div className="mini-lines" />
        <div className="mini-rule-boxed" />
        <div className="mini-lines" />
      </div>
    );
  }
  if (template === "canadian_executive") {
    return (
      <div className="mini-paper canadian-mini" style={{ textAlign: "left" }}>
        <div className="mini-title-center" style={{ margin: "0 0 6px 0", width: "75%" }} />
        <div className="mini-rule-full" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", margin: "4px 0" }}>
          <i style={{ height: "2px", background: "#94a3b8", display: "block" }} />
          <i style={{ height: "2px", background: "#94a3b8", display: "block" }} />
          <i style={{ height: "2px", background: "#94a3b8", display: "block" }} />
        </div>
        <div className="mini-rule-full" />
        <div className="mini-lines" />
      </div>
    );
  }
  if (template.startsWith("canadian")) {
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
  if (template === "europass_modern") {
    return (
      <div className="mini-paper europass-mini">
        <div className="europass-top-bar euro-bar-modern" />
        <div className="europass-split-grid">
          <div className="europass-left-col"><i style={{ background: "#2563eb" }} /><i style={{ background: "#2563eb" }} /></div>
          <div className="europass-right-col"><i /><i /><i /></div>
        </div>
      </div>
    );
  }
  if (template === "europass_academic") {
    return (
      <div className="mini-paper europass-mini">
        <div className="europass-top-bar" style={{ background: "#0c4a6e", height: "8px" }} />
        <div className="europass-split-grid">
          <div className="europass-left-col"><i style={{ background: "#0c4a6e" }} /><i style={{ background: "#0c4a6e" }} /><i style={{ background: "#0c4a6e" }} /></div>
          <div className="europass-right-col"><i /><i /><i /></div>
        </div>
      </div>
    );
  }
  if (template.startsWith("europass")) {
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
  if (template === "professional_modern") {
    return (
      <div className="mini-paper professional-mini">
        <div className="prof-mini-banner prof-banner-modern" />
        <div className="prof-mini-body">
          <div className="prof-mini-side" style={{ background: "#f8fafc" }} />
          <div className="prof-mini-main"><i style={{ background: "#1e293b" }} /><i /><i /></div>
        </div>
      </div>
    );
  }
  if (template === "professional_compact") {
    return (
      <div className="mini-paper professional-mini">
        <div className="prof-mini-banner" style={{ background: "#0f172a", height: "12px" }} />
        <div className="prof-mini-body">
          <div className="prof-mini-side prof-side-dark" />
          <div className="prof-mini-main"><i style={{ background: "#0f172a" }} /><i /><i /></div>
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

function HeroPreviewScaled({ data }: { data: CvData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.44);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const availableW = w > 0 ? w : (typeof window !== "undefined" ? window.innerWidth - 32 : 360);
        const calcScale = Math.min(Math.max((availableW - 12) / 794, 0.28), 0.58);
        setScale(Math.round(calcScale * 1000) / 1000);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scaledWidth = Math.round(794 * scale);
  const scaledHeight = Math.round(1123 * scale);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          minHeight: `${scaledHeight}px`,
          overflow: "hidden",
          position: "relative",
          borderRadius: "6px",
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.14)",
          background: "#ffffff",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: "794px",
            minHeight: "1123px",
            pointerEvents: "none",
          }}
        >
          <ResumePreview data={data} editable={false} />
        </div>
      </div>
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
              <HeroPreviewScaled data={showcaseSampleData} />
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
                Trois familles de modèles.<br />
                <em>9 variantes certifiées conformes.</em>
              </h2>
            </div>
            <p>
              Choisissez parmi nos modèles Exécutifs (2 colonnes), Canadiens ATS (1 colonne sans photo) ou Europass Officiels (UE), disponibles en 5 langues.
            </p>
          </div>
          <div className="template-gallery template-gallery-three">
            {[
              templateCatalog.professional_executive,
              templateCatalog.canadian_classic,
              templateCatalog.europass_classic,
            ].map((template, index) => (
              <article className={`template-card template-card-${template.id}`} key={template.id}>
                <div className="template-label">
                  <span>{template.eyebrow}</span>
                  <span>0{index + 1}</span>
                </div>
                <div className="landing-template-preview-box">
                  <TemplateMini template={template.id} />
                </div>
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
            ))}
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
  const { user, openAuthModal, loginDemoGoogle, saveCvToCloud, savedCvs } = useAuth();
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [showPostUnlockModal, setShowPostUnlockModal] = useState(false);
  const [step, setStep] = useState<BuilderStep>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cv_tounsi_builder_step");
      if (saved !== null) {
        const num = Number(saved);
        if (num >= 0 && num <= 3) return num as BuilderStep;
      }
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cv_tounsi_builder_step", step.toString());
    }
  }, [step]);

  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const [unlockedPlan, setUnlockedPlan] = useState<"month" | "year">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cv_tounsi_client_plan");
      if (saved === "month" || saved === "student") return "month";
      if (saved === "year" || saved === "pro") return "year";
    }
    return "year";
  });

  const subscriptionInfo = useMemo(() => {
    return getSubscriptionStatus(isUnlocked, unlockedPlan);
  }, [isUnlocked, unlockedPlan]);

  // Both 1 Month (12.900 TND) and 1 Year (29.900 TND) unlock 100% of all templates & HD downloads
  const isCurrentCvUnlocked = useMemo(() => isUnlocked, [isUnlocked]);

  // ── Approche A : Auto-save unlocked CV when guest user signs in after activation ──
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (!prevUserRef.current && user && isUnlocked) {
      saveCvToCloud({
        id: activeCvId || undefined,
        title: `${data.fullName || "Mon CV"} — ${data.targetRole || "Candidat"}`,
        dataJson: data,
        template: data.template,
        language: data.language,
        isUnlocked: true,
      })
        .then((saved) => {
          if (saved && setActiveCvId) {
            setActiveCvId(saved.id);
          }
          setShowPostUnlockModal(false);
          toast.success("🎉 Compte lié avec succès ! Votre CV débloqué est sauvegardé sur votre espace Cloud.");
        })
        .catch((err) => console.warn("[Cloud] Auto-save on link error:", err));
    }
    prevUserRef.current = user;
  }, [user, isUnlocked, data, activeCvId, saveCvToCloud, setActiveCvId]);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"month" | "year">("year");
  const [isScreenProtected, setIsScreenProtected] = useState(false);
  const [clientCodeInput, setClientCodeInput] = useState("");

  const [isExporting, setIsExporting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [expLoadingIdx, setExpLoadingIdx] = useState<number | null>(null);
  const [isSkillsLoading, setIsSkillsLoading] = useState(false);
  const [isLanguagesLoading, setIsLanguagesLoading] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("all");

  const filteredTemplates = useMemo(() => {
    const list = [
      templateCatalog.professional_executive,
      templateCatalog.professional_modern,
      templateCatalog.professional_compact,
      templateCatalog.canadian_classic,
      templateCatalog.canadian_modern,
      templateCatalog.canadian_executive,
      templateCatalog.europass_classic,
      templateCatalog.europass_modern,
      templateCatalog.europass_academic,
    ];
    if (selectedCategory === "all") return list;
    return list.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const printTargetRef = useRef<HTMLDivElement | null>(null);

  const isStudent = data.profileType === "student";

  // Keep selected plan aligned with profile type when user toggles profile
  useEffect(() => {
    setSelectedPlan(data.profileType === "student" ? "student" : "pro");
  }, [data.profileType]);

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
            const plan: "student" | "pro" = data.plan || "pro";
            setUnlockedPlan(plan);
            localStorage.setItem("cv_tounsi_client_unlocked", "true");
            localStorage.setItem("cv_tounsi_client_plan", plan);
          } else {
            setIsUnlocked(false);
            localStorage.removeItem("cv_tounsi_client_unlocked");
            localStorage.removeItem("cv_tounsi_client_token");
            localStorage.removeItem("cv_tounsi_client_plan");
            localStorage.removeItem("cv_tounsi_student_unlocked_cv_id");
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
      const cleanCode = clientCodeInput.trim();
      const userToken = typeof window !== "undefined" ? localStorage.getItem("cvtounsi_user_token") : null;
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
        },
        body: JSON.stringify({
          code: cleanCode,
          fullName: data.fullName,
          email: user?.email || data.email,
          phone: data.phone,
        }),
      });

      const result = await res.json();

      if (result.valid) {
        setIsUnlocked(true);
        const plan: "student" | "pro" = result.plan || (cleanCode.toUpperCase().includes("13") ? "student" : "pro");
        setUnlockedPlan(plan);
        if (result.token) {
          localStorage.setItem("cv_tounsi_client_token", result.token);
        }
        localStorage.setItem("cv_tounsi_client_unlocked", "true");
        localStorage.setItem("cv_tounsi_client_plan", plan);
        localStorage.setItem("cv_tounsi_activation_date", String(Date.now()));

        if (plan === "student") {
          const assignedId = activeCvId !== null && activeCvId !== undefined ? String(activeCvId) : "primary_draft";
          localStorage.setItem("cv_tounsi_student_unlocked_cv_id", assignedId);
        } else {
          localStorage.removeItem("cv_tounsi_student_unlocked_cv_id");
        }

        setShowPaywallModal(false);

        const isYear = plan === "year" || plan === "pro";
        // ── Deduplicated Meta Pixel + CAPI Purchase Event ──
        trackCodeActivated({
          method: isYear ? "YearPassCode" : "MonthPassCode",
          plan: isYear ? "year" : "month",
          amount: result.amount || (isYear ? 29.9 : 12.9),
          eventId: result.eventId,
          fullName: data.fullName,
          email: user?.email || data.email,
        });

        // ── Auto-save unlocked state into Cloud database if user is authenticated ──
        if (user) {
          saveCvToCloud({
            id: activeCvId || undefined,
            title: `${data.fullName || "Mon CV"} — ${data.targetRole || "Candidat"}`,
            dataJson: data,
            template: data.template,
            language: data.language,
            isUnlocked: true,
          }).catch((err) => console.warn("[Cloud] Auto-save on unlock error:", err));
          toast.success(
            isYear
              ? "👑 Pass 1 An (29.900 DT) validé avec succès ! Accès VIP 1 an débloqué."
              : "⭐ Pass 1 Mois (12.900 DT) validé avec succès ! Accès 30 jours débloqué."
          );
        } else {
          // ── Approche A : Open Post-Unlock Account Linking Modal for Guest Users ──
          setShowPostUnlockModal(true);
          toast.success(
            isYear
              ? "👑 Pass 1 An validé ! Votre CV HD A4 et accès 1 an sont débloqués."
              : "⭐ Pass 1 Mois validé ! Votre CV HD A4 et accès 30 jours sont débloqués."
          );
        }

        executeDownloadPdf(false);
        return;
      }
    } catch {
      toast.error("Erreur de connexion au serveur de validation. Veuillez vérifier votre connexion internet et réessayer.");
      return;
    }

    toast.error("Code d'activation incorrect. Veuillez vérifier le code reçu sur WhatsApp (+216 92 067 554).");
  };

  const handleRelockForTest = () => {
    setIsUnlocked(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cv_tounsi_client_unlocked");
      localStorage.removeItem("cv_tounsi_client_token");
      localStorage.removeItem("cv_tounsi_client_plan");
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
      setData(showcaseSampleData);
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

    const globalContext = data.targetRole || (data.profileSummary && data.profileSummary.length < 80 ? data.profileSummary : "");

    try {
      const formatted = await improveExperienceWithGemini({
        language: data.language,
        targetRole: globalContext || exp.role,
        role: exp.role || (isStudent ? "Projet d'études" : "Poste"),
        company: exp.company || (isStudent ? "Université" : "Entreprise"),
        description: exp.description || "Détails et activités",
        profileType: data.profileType,
      });

      updateExperience(idx, "description", formatted);
      toast.success(isStudent ? `Le projet #${idx + 1} a été valorisé par l'IA !` : `L'expérience #${idx + 1} a été optimisée en puces d'impact !`);
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
    const domainContext = data.targetRole || (data.profileSummary && data.profileSummary.length < 80 ? data.profileSummary : (isStudent ? "Étudiant / Junior" : "Professionnel"));
    try {
      const skills = await improveSkillsWithGemini({
        language: data.language,
        targetRole: domainContext,
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

  /* ── Step 2: Suggest & Format Languages with AI ── */
  const handleImproveLanguages = async () => {
    setIsLanguagesLoading(true);
    trackAIUsed("LanguagesSuggestion");
    try {
      const langs = await improveLanguagesWithGemini({
        language: data.language,
        targetRole: data.targetRole || (data.profileSummary && data.profileSummary.length < 80 ? data.profileSummary : "Professionnel"),
        currentLanguages: data.languagesList,
        profileType: data.profileType,
      });
      setData((prev) => ({ ...prev, languagesList: langs }));
      toast.success("Langues optimisées avec les niveaux officiels !");
    } catch (error) {
      toast.error("Impossible d'optimiser les langues pour le moment.");
    } finally {
      setIsLanguagesLoading(false);
    }
  };

  const addQuickLanguage = (langToAdd: string) => {
    setData((prev) => {
      const current = (prev.languagesList || "").trim();
      if (!current) return { ...prev, languagesList: langToAdd };
      const langPrefix = langToAdd.split(" ")[0];
      if (current.toLowerCase().includes(langPrefix.toLowerCase())) {
        toast.info(`${langPrefix} est déjà dans votre liste.`);
        return prev;
      }
      return { ...prev, languagesList: `${current} · ${langToAdd}` };
    });
    toast.success(`+ ${langToAdd} ajouté !`);
  };

  /* ── Global Copy Optimization with AI ── */
  const improveCopy = async () => {
    setIsGlobalLoading(true);
    trackAIUsed("FullCVHarmonization");
    const domainContext = data.targetRole || (data.profileSummary && data.profileSummary.length < 80 ? data.profileSummary : "Professionnel");
    try {
      const firstExp = data.experiences[0] || {
        role: isStudent ? "Projet d'études" : "Spécialiste",
        company: isStudent ? "Université" : "Entreprise",
        description: "Missions",
      };
      const result = await improveFullCvWithGemini({
        language: data.language,
        targetRole: domainContext,
        experienceRole: firstExp.role || domainContext,
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
    if (!isCurrentCvUnlocked) {
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
        toast.success("Fichier démo téléchargé ! Contactez-nous sur WhatsApp (+216 92 067 554) pour obtenir la version nette.");
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
      {/* ═══════════════════════════════════════════════════════════════════════
         ÉTAPE 01: CHOIX DU MODÈLE & STYLE VISUEL (Modèle en premier)
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">SÉLECTION DU MODÈLE & STYLE</div>
          <h2>Choisissez votre modèle de CV & langue.</h2>
          <p className="panel-lead">
            Sélectionnez parmi 9 modèles certifiés et conformes aux normes internationales (Exécutif 2 colonnes, Canadien ATS 1 colonne ou Europass UE), votre profil et la langue du CV.
          </p>

          {/* ── Profile Type Selector (Experienced vs Student) ── */}
          <div className="panel-kicker" style={{ marginTop: "1rem" }}>VOTRE SITUATION / PROFIL</div>
          <div className="profile-type-grid" style={{ marginBottom: "0.8rem" }}>
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
                <p>Expérience professionnelle (CDI, CDD, Freelance...). Postes valorisés.</p>
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
                <p>Recherche de stage PFE ou 1er emploi. Formations et projets valorisés.</p>
              </div>
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.2rem" }}>
            <button
              type="button"
              style={{ fontSize: "0.72rem", color: "var(--olive-dark)", background: "transparent", textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}
              onClick={() => loadSample(data.profileType)}
            >
              ✦ Charger un exemple type {isStudent ? "Étudiant (PFE / Projets)" : "Professionnel Expérimenté"}
            </button>
          </div>

          {/* ── Category Filter Tabs ── */}
          <div className="panel-kicker">BIBLIOTHÈQUE DE MODÈLES CONFORMES (9)</div>
          <div className="template-category-tabs">
            {[
              { id: "all", label: "Tous les modèles (9)" },
              { id: "professional", label: "💼 Professionnels (3)" },
              { id: "canadian", label: "🍁 Canadiens ATS (3)" },
              { id: "europass", label: "🇪🇺 Europass UE (3)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`template-category-tab ${selectedCategory === tab.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(tab.id as TemplateCategory)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── 9 Templates Responsive Grid ── */}
          <div className="template-options-grid">
            {filteredTemplates.map((template) => {
              const isSelected =
                data.template === template.id ||
                (data.template === "professional" && template.id === "professional_executive") ||
                (data.template === "canadian" && template.id === "canadian_classic") ||
                (data.template === "europass" && template.id === "europass_classic");
              const isProOnly = isProOnlyTemplate(template.id);
              const tagClass =
                template.category === "canadian"
                  ? "tag-can"
                  : template.category === "europass"
                  ? "tag-euro"
                  : "tag-prof";

              return (
                <div
                  key={template.id}
                  className={`template-grid-card ${isSelected ? "selected" : ""}`}
                  onClick={() => selectTemplate(template.id)}
                  title={`Sélectionner le modèle ${template.label}`}
                >
                  <div className="template-grid-card-preview">
                    <TemplateMini template={template.id} />
                  </div>
                  <div className="template-grid-card-info">
                    <div className="template-grid-card-top-row">
                      <span className={`template-compliance-tag ${tagClass}`}>
                        {template.badge}
                      </span>
                      {isProOnly && (
                        <span className="pro-vip-badge" title="Modèle Exécutif Réservé au Pass Pro VIP">
                          <Crown size={10} /> PRO VIP
                        </span>
                      )}
                    </div>
                    <h4>{template.label}</h4>
                    <p>{template.description}</p>
                    <span className="template-grid-card-note">🛡️ {template.complianceNote}</span>
                  </div>
                  <div className="template-grid-radio-indicator" />
                </div>
              );
            })}
          </div>

          {/* ── Language Selection ── */}
          <div className="option-section" style={{ marginTop: "1rem" }}>
            <div className="option-heading">
              <span>Langue du CV</span>
              <small>{(templateCatalog[data.template] || templateCatalog.professional_executive).languages.length} langue(s) disponible(s)</small>
            </div>
            <div className="language-options">
              {(templateCatalog[data.template] || templateCatalog.professional_executive).languages.map((lang) => (
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

      {/* ═══════════════════════════════════════════════════════════════════════
         ÉTAPE 02: VOS INFORMATIONS DE CONTACT & ACCROCHE IA
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">COORDONNÉES & ACCROCHE PROFESSIONNELLE</div>
          <h2>Vos informations de contact.</h2>
          <p className="panel-lead">
            Renseignez votre identité et personnalisez votre accroche professionnelle avec l'aide de l'IA.
          </p>

          <div className="panel-kicker" style={{ marginTop: "1rem" }}>COORDONNÉES PRINCIPALES</div>
          <div className="form-grid">
            <Field
              label="Nom complet"
              value={data.fullName}
              onChange={(v) => update("fullName", v)}
              placeholder="Ex. Mohamed Ben Ali"
            />
            <Field
              label={isStudent ? "Intitulé du profil / Stage visé" : "Poste recherché / Titre"}
              value={data.targetRole}
              onChange={(v) => update("targetRole", v)}
              placeholder={isStudent ? "Ex. Étudiant Ingénieur (Recherche Stage PFE)" : "Ex. Responsable Marketing & Ventes"}
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

          <div className="field field-full" style={{ marginTop: "1rem" }}>
            {/* AI Callout Tip (Tâche 7) */}
            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1.5px dashed #86efac", borderRadius: "10px", padding: "0.65rem 0.85rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ fontSize: "0.76rem", color: "#166534", fontWeight: 600 }}>
                💡 <b>Astuce IA :</b> 1 clic sur le bouton ci-contre pour générer une accroche percutante au standard recruteur !
              </div>
              <button
                type="button"
                className="button-ai-micro"
                onClick={handleImproveProfile}
                disabled={isProfileLoading}
                title="Générer une accroche adaptée avec l'Intelligence Artificielle"
                style={{ flexShrink: 0 }}
              >
                {isProfileLoading ? (
                  <>
                    <span className="button-spinner-sm" /> Génération...
                  </>
                ) : (
                  <>
                    <WandSparkles size={12} /> ✨ Améliorer avec l'IA
                  </>
                )}
              </button>
            </div>

            <div className="field-header-row">
              <span>{isStudent ? "Accroche / Objectif de stage ou carrière" : "Profil professionnel / Accroche"}</span>
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

      {/* ═══════════════════════════════════════════════════════════════════════
         ÉTAPE 03: EXPÉRIENCES & PROJETS D'ÉTUDES (Optimisés IA)
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
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

          {/* AI Callout Tip for Experiences (Tâche 7) */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", border: "1.5px dashed #86efac", borderRadius: "10px", padding: "0.6rem 0.85rem", marginBottom: "0.9rem", fontSize: "0.76rem", color: "#166534", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={15} style={{ color: "#16a34a", flexShrink: 0 }} />
            <span>💡 <b>Boost Recruteur :</b> Cliquez sur <b>✨ Améliorer (IA)</b> sur chaque carte pour transformer vos tâches en puces d'impact chiffrées !</span>
          </div>

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

      {/* ═══════════════════════════════════════════════════════════════════════
         ÉTAPE 04: FORMATION, COMPÉTENCES, LANGUES & EXPORT FINAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="form-panel reveal-up">
          <div className="panel-kicker">FORMATION, SAVOIR-FAIRE & EXPORT PDF</div>
          <h2>Diplômes, compétences et export final.</h2>
          <p className="panel-lead">
            {isStudent
              ? "Votre formation académique est au cœur de votre CV. Détaillez vos études, générez vos compétences clés et exportez votre CV."
              : "Détaillez vos formations universitaires, enrichissez vos compétences avec l'IA et téléchargez votre CV certifié."}
          </p>

          {/* ── AI Harmonization Banner ── */}
          <div className="ai-step-banner" style={{ marginBottom: "1.6rem" }}>
            <div className="ai-step-banner-icon">
              <WandSparkles size={20} />
            </div>
            <div className="ai-step-banner-text">
              <strong>Harmonisation Globale par l'IA</strong>
              <p>Harmonisez automatiquement tous les textes, mots-clés et tournures de phrases pour votre profil {isStudent ? "étudiant" : "professionnel"}.</p>
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

          {/* ── Formations & Diplômes ── */}
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

          {/* ── Compétences Clés ── */}
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

          {/* ── Langues Pratiquées ── */}
          <div className="section-subheading" style={{ marginTop: "1.8rem" }}>
            <Globe size={16} /> Langues Pratiquées
          </div>
          <div className="field field-full">
            <div className="field-header-row">
              <span>Langues & niveaux de maîtrise (séparées par « · »)</span>
              <button
                type="button"
                className="button-ai-micro"
                onClick={handleImproveLanguages}
                disabled={isLanguagesLoading}
                title="Suggérer les langues avec leurs niveaux officiels"
              >
                {isLanguagesLoading ? (
                  <>
                    <span className="button-spinner-sm" /> Formatage IA...
                  </>
                ) : (
                  <>
                    <WandSparkles size={12} /> Suggérer les langues (IA)
                  </>
                )}
              </button>
            </div>
            <textarea
              value={data.languagesList || ""}
              onChange={(e) => update("languagesList", e.target.value)}
              placeholder="Ex. Arabe (Langue maternelle) · Français (Bilingue / C2) · Anglais (Courant / C1) · Allemand (Notions / B1)"
              rows={2}
            />
            {/* Chips d'ajout rapide en 1 clic */}
            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-soft)", fontWeight: 600, marginRight: "2px" }}>
                Ajout rapide :
              </span>
              {[
                "Arabe (Langue maternelle)",
                "Français (Bilingue / C2)",
                "Anglais (Courant / C1)",
                "Allemand (B2 / Intermédiaire)",
                "Italien (B1 / Conversationnel)",
                "Espagnol (A2 / Notions)",
              ].map((quickLang) => (
                <button
                  key={quickLang}
                  type="button"
                  onClick={() => addQuickLanguage(quickLang)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "3px 8px",
                    background: "#f3eedf",
                    border: "1px solid #dcd1ba",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "var(--olive-dark)",
                    transition: "all 140ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e4dcbe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f3eedf";
                  }}
                >
                  + {quickLang}
                </button>
              ))}
            </div>
          </div>

          {/* ── Export Action Box ── */}
          <div className="export-action-box" style={{ marginTop: "2.2rem", padding: "20px", background: "#f5efe3", border: "1.5px solid #dcd1ba", borderRadius: "12px", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--olive-dark)", marginBottom: "6px" }}>
              Votre CV est prêt à être exporté !
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)", maxWidth: "460px", margin: "0 auto 16px", lineHeight: 1.45 }}>
              Document au format officiel A4 haute résolution (300 DPI), optimisé pour les logiciels recruteurs ATS et l'impression directe.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={handleDownloadClick}
                disabled={isExporting}
                style={{ fontSize: "0.88rem", padding: "0.75rem 1.8rem" }}
              >
                <Download size={16} /> {isExporting ? "Génération du PDF..." : "Télécharger mon CV (PDF A4)"}
              </button>
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
                Ce document est un extrait protégé de démonstration. Pour débloquer votre <b>CV complet en Haute Définition</b> (sans flou et sans filigrane) :
              </p>
              
              <div className="pdf-paywall-box-highlight">
                <div className="price-row">Tarifs Déblocage : 12.900 TND (Pass 1 Mois) · 29.900 TND (Pass 1 An)</div>
                <div style={{ pointerEvents: "auto", marginTop: "4px" }}>
                  <a
                    href={`https://wa.me/21692067554?text=${encodeURIComponent("نحب نفعّل CV Tounsi متاعي 🫒")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-num"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#059669",
                      textDecoration: "underline",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <span>WhatsApp : +216 92 067 554 · D17 / Flouci / Virement</span>
                  </a>
                </div>
              </div>

              {/* Clickable Buy & Unlock Button */}
              <div style={{ pointerEvents: "auto", margin: "0.8rem 0" }}>
                <a
                  href={`https://wa.me/21692067554?text=${encodeURIComponent("نحب نفعّل CV Tounsi متاعي 🫒")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-paywall-buy-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#25D366",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    padding: "0.85rem 1.6rem",
                    borderRadius: "10px",
                    boxShadow: "0 4px 14px rgba(37, 211, 102, 0.4)",
                    cursor: "pointer",
                  }}
                >
                  <span>👉 Acheter & Débloquer sur WhatsApp (+216 92 067 554)</span>
                </a>
              </div>

              <div className="pdf-paywall-instructions">
                Cliquez sur le bouton ci-dessus pour recevoir instantanément votre code d'activation certifié.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Paywall & Monetization Modal with Dual Pricing ── */}
      {showPaywallModal && (
        <div className="paywall-modal-backdrop" onClick={() => setShowPaywallModal(false)}>
          <div className="paywall-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="paywall-modal-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src="/icon.jpg" alt="CV Tounsi Logo" style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }} />
              <div style={{ flex: 1 }} dir="rtl">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  🔓 فعّل الـ CV متاعك بالـ Haute Définition
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "2px 0 0" }}>
                  ملف PDF A4 بدقة 300 DPI مطابق للمواصفات التونسية، الكندية والأوروبية ATS
                </p>
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
              {/* ── Free Demo Download Bar ── */}
              <div style={{ marginBottom: "0.85rem" }}>
                <button
                  type="button"
                  className="download-demo-btn"
                  onClick={() => executeDownloadPdf(true)}
                  style={{
                    background: "#fbf9f4",
                    border: "1.5px dashed #c8beab",
                    padding: "0.6rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "0.78rem",
                    color: "var(--ink)",
                    fontWeight: 700,
                    borderRadius: "8px",
                    width: "100%",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  <Download size={15} style={{ color: "var(--olive-dark)" }} />
                  <span>📥 تحميل نسخة تجريبية مجانية (نسخة Démo للتقييم)</span>
                </button>
              </div>

              {/* ── Cloud Account Synchronization Banner ── */}
              {!user ? (
                <div className="paywall-account-banner guest" dir="rtl">
                  <div className="paywall-account-banner-left">
                    <div className="paywall-account-icon-wrap">
                      <Cloud size={16} />
                    </div>
                    <div>
                      <strong>حفظ الـ CV أونلاين على حسابك</strong>
                      <p>سجّل دخولك باش ترجع تعدّل على الـ CV متاعك من الهاتف أو الحاسوب في أي وقت.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="paywall-account-btn"
                    onClick={() => openAuthModal("login")}
                  >
                    تسجيل الدخول
                  </button>
                </div>
              ) : (
                <div className="paywall-account-banner logged-in" dir="rtl">
                  <div className="paywall-account-banner-left">
                    <div className="paywall-account-icon-wrap active">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <strong>حساب متصل : {user.name || user.email}</strong>
                      <p>عملية التفعيل والـ CVs متاعك باش تتحفظ أوتوماتيكياً على حسابك الشخصي.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Dual Pricing Plan Selector ── */}
              <div style={{ marginBottom: "0.5rem" }} dir="rtl">
                <span style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "var(--ink)", marginBottom: "0.45rem" }}>
                  1️⃣ اختار الباقة المناسبة ليك :
                </span>
                <div className="paywall-plans-grid" style={{ direction: "ltr" }}>
                  {/* Option 1: Pass 1 Mois */}
                  <div
                    className={`paywall-plan-card ${selectedPlan === "month" ? "selected" : ""}`}
                    onClick={() => setSelectedPlan("month")}
                  >
                    <div>
                      <span className="paywall-plan-tag tag-student">⭐ دخول لمدة شهر (30 يوم)</span>
                      <div className="paywall-plan-title">Pass شهر</div>
                      <div className="paywall-plan-sub">استعمال كامل وغير محدود طيلة 30 يوم</div>
                      <div className="paywall-price-wrap">
                        <span className="paywall-price-main">12.900</span>
                        <span className="paywall-price-unit">دينار</span>
                      </div>
                    </div>
                    <ul className="paywall-features-list">
                      <li><Check size={12} /> <strong>Tous les 9 modèles</strong> (Tunisie, Canada, UE)</li>
                      <li><Check size={12} /> <strong>CVs illimités</strong> en Haute Définition (300 DPI)</li>
                      <li><Check size={12} /> <strong>IA Gemini Flash</strong> illimitée</li>
                      <li><Check size={12} /> <strong>Sauvegarde en ligne</strong> (PC & Mobile)</li>
                    </ul>
                  </div>

                  {/* Option 2: Pass 1 An */}
                  <div
                    className={`paywall-plan-card ${selectedPlan === "year" ? "selected" : ""}`}
                    onClick={() => setSelectedPlan("year")}
                  >
                    <div>
                      <span className="paywall-plan-tag tag-pro">
                        👑 أفضل عرض · تخفيض 80%
                      </span>
                      <div className="paywall-plan-title">
                        Pass سنة VIP
                      </div>
                      <div className="paywall-plan-sub">
                        استعمال كامل لمدة سنة كاملة (12 شهر)
                      </div>
                      <div className="paywall-price-wrap">
                        <span className="paywall-price-main">29.900</span>
                        <span className="paywall-price-unit">دينار</span>
                        <span className="paywall-price-struck">59 DT</span>
                      </div>
                    </div>
                    <ul className="paywall-features-list">
                      <li><Check size={12} /> <strong>Tous les 9 modèles</strong> (Tunisie, Canada, UE)</li>
                      <li><Check size={12} /> <strong>CVs illimités</strong> en Haute Définition (300 DPI)</li>
                      <li><Check size={12} /> <strong>IA Gemini Flash</strong> illimitée pendant 1 an</li>
                      <li><Check size={12} /> <strong>Sauvegarde en ligne & Support VIP</strong> 1 an</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── 3 Étapes Claires de Paiement D17 en Arabe ── */}
              <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "0.75rem" }} dir="rtl">
                <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a", marginBottom: "0.45rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📲 كيفاش تفعّل الـ CV متاعك في 3 خطوات ساهلة :</span>
                </div>
                <div style={{ fontSize: "0.77rem", color: "#334155", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "4px" }}>
                    <b>1.</b> ابعث <b>{selectedPlan === "month" ? "12.900 دينار" : "29.900 دينار"}</b> عبر <b>D17 على الرقم : 92 067 554</b> <i>(أو Flouci / تحويل بنكي)</i>.
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <b>2.</b> ابعث لقطة شاشة للوصل (Capture) على الواتساب بكليك وحدة على الزر الأخضر بالأسفل.
                  </div>
                  <div>
                    <b>3.</b> يوصلك <b>كود التفعيل الرسمي في أقل من دقيقتين</b> ✅
                  </div>
                </div>
              </div>

              {/* ── CTA WhatsApp Button (Direct Order & Receipt Sending) ── */}
              <div style={{ marginBottom: "0.65rem" }}>
                <a
                  href={`https://wa.me/21692067554?text=${encodeURIComponent(
                    selectedPlan === "month"
                      ? "نحب نفعّل Pass شهر CV Tounsi (12.9 DT) 🫒"
                      : "نحب نفعّل Pass سنة VIP CV Tounsi (29.9 DT) 👑"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-action-btn"
                  onClick={() => {
                    trackWhatsAppClicked("ORDER", selectedPlan, data.fullName);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "9px",
                    background: "#25D366",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    padding: "0.85rem 1.4rem",
                    borderRadius: "12px",
                    boxShadow: "0 4px 14px rgba(37, 211, 102, 0.4)",
                    cursor: "pointer",
                  }}
                >
                  <MessageCircle size={18} />
                  <span>
                    {`اطلب (${selectedPlan === "month" ? "12.9 دينار" : "29.9 دينار"}) وابعث الوصل على WhatsApp 🚀`}
                  </span>
                </a>
              </div>

              {/* 4 Trust Badges (Tâche 3) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "0.85rem", fontSize: "0.72rem", color: "#475569", background: "#ffffff", border: "1px solid #e2e8f0", padding: "0.55rem 0.75rem", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  <span className="text-amber-500">⚡</span> Réponse &lt; 2 min (7j/7)
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  <span className="text-emerald-600">🔒</span> +2 500 CVs activés · ⭐ 4.9/5
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  <span className="text-blue-600">💯</span> 100% Satisfait ou Remboursé
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                  <span className="text-purple-600">📄</span> PDF HD 300 DPI ATS
                </div>
              </div>

              {/* Step 3: Enter Client Activation Code */}
              <div className="client-unlock-box">
                <div className="client-unlock-title">
                  <Key size={14} /> 3. Vous avez reçu votre code ? Entrez-le ici :
                </div>
                <p className="client-unlock-desc">
                  Saisissez votre code d'activation pour débloquer immédiatement votre CV en Haute Définition.
                </p>

                <form onSubmit={handleUnlockWithClientCode} className="client-unlock-form">
                  <input
                    type="text"
                    className="client-unlock-input"
                    placeholder="Entrez votre code d'activation ici..."
                    value={clientCodeInput}
                    onChange={(e) => setClientCodeInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="client-unlock-btn">
                    Activer & Télécharger HD
                  </button>
                </form>
              </div>

              {/* ── Trust & Psychological Reassurance Guarantee Box (Point 3) ── */}
              <div className="paywall-guarantee-box">
                <div className="paywall-guarantee-title">
                  <ShieldCheck size={14} /> Garanties de Confiance & Sécurité 2026 :
                </div>
                <div className="paywall-guarantee-grid">
                  <div className="paywall-guarantee-item">
                    <ShieldCheck size={14} />
                    <div>
                      <strong>Garantie Satisfait ou Remboursé</strong>
                      <span>Remboursement intégral sous 24h sur simple demande si non-conforme.</span>
                    </div>
                  </div>
                  <div className="paywall-guarantee-item">
                    <Check size={14} />
                    <div>
                      <strong>Conformité ATS Internationale</strong>
                      <span>100% lisible par les logiciels recruteurs (Canada, France, UE, Golfe, Tunisie).</span>
                    </div>
                  </div>
                  <div className="paywall-guarantee-item">
                    <Lock size={14} />
                    <div>
                      <strong>Paiement Unique Sans Surprise</strong>
                      <span>Aucun abonnement caché ni prélèvement automatique futur.</span>
                    </div>
                  </div>
                  <div className="paywall-guarantee-item">
                    <MessageCircle size={14} />
                    <div>
                      <strong>Assistance Dédiée 7j/7</strong>
                      <span>Accompagnement et aide personnalisée sur WhatsApp par un conseiller.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-Unlock Account Linking Modal (Approche A) ── */}
      {showPostUnlockModal && (
        <div className="paywall-modal-backdrop" onClick={() => setShowPostUnlockModal(false)}>
          <div className="post-unlock-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className={`post-unlock-header ${unlockedPlan === "year" ? "pro" : "student"}`}>
              <div className={`post-unlock-badge-pill ${unlockedPlan === "year" ? "pro-badge" : "student-badge"}`}>
                {unlockedPlan === "year" ? (
                  <>
                    <Crown size={13} /> 👑 PASS 1 AN ACTIVÉ (29.900 TND) — VIP
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> ⭐ PASS 1 MOIS ACTIVÉ (12.900 TND)
                  </>
                )}
              </div>
              <h3>
                {unlockedPlan === "year"
                  ? "🚀 Bienvenue dans votre Espace VIP 1 An !"
                  : "🌟 Votre Pass 1 Mois est Activé en Haute Définition !"}
              </h3>
              <p>
                {unlockedPlan === "year"
                  ? `Votre accès 1 an est actif jusqu'au ${subscriptionInfo.expiresAtFormatted} (365 jours) : 9 modèles internationaux, multi-CVs et IA sans limite.`
                  : `Votre accès 1 mois est actif jusqu'au ${subscriptionInfo.expiresAtFormatted} (30 jours) : 9 modèles internationaux, multi-CVs et IA sans limite.`}
              </p>
            </div>

            <div className="post-unlock-body">
              <div className="post-unlock-plan-summary pro-summary">
                <div className="plan-summary-title">
                  {unlockedPlan === "year" ? "👑 Vos Avantages 1 An Inclus :" : "⭐ Vos Avantages 1 Mois Inclus :"}
                </div>
                <ul className="plan-summary-list">
                  <li>
                    <Check size={14} style={{ color: "#16a34a" }} />
                    <span><b>Création de CVs illimités</b> : Déclinez autant de versions de CV que souhaité</span>
                  </li>
                  <li>
                    <Check size={14} style={{ color: "#16a34a" }} />
                    <span><b>Bibliothèque intégrale (9 modèles)</b> : Exécutifs 2 col, Canadiens ATS & Europass UE</span>
                  </li>
                  <li>
                    <Check size={14} style={{ color: "#16a34a" }} />
                    <span><b>Intelligence Artificielle Illimitée</b> pour tous vos postes, accroches et compétences</span>
                  </li>
                  <li>
                    <Check size={14} style={{ color: "#16a34a" }} />
                    <span><b>Sauvegarde en ligne</b> synchronisée en temps réel sur PC, Mac et Téléphone</span>
                  </li>
                </ul>
              </div>

              <div className="post-unlock-callout pro-callout" style={{ marginTop: "1rem" }}>
                <strong>⚡ Sauvegardez votre CV en ligne :</strong>
                <p>
                  Créez votre compte en 10 secondes pour sauvegarder ce CV et le retrouver sur votre téléphone ou ordinateur à tout moment.
                </p>
              </div>

              <div className="post-unlock-actions" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  type="button"
                  className="post-unlock-email-btn"
                  onClick={() => {
                    setShowPostUnlockModal(false);
                    openAuthModal("register");
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#2d6a4f",
                    color: "#ffffff",
                    fontWeight: 700,
                    padding: "0.85rem 1.2rem",
                    borderRadius: "12px",
                    fontSize: "0.92rem",
                    boxShadow: "0 2px 8px rgba(45,106,79,0.25)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  <Mail size={16} />
                  <span>Créer mon compte avec Email & Mot de passe</span>
                </button>

                <button
                  type="button"
                  className="post-unlock-later-btn"
                  onClick={() => setShowPostUnlockModal(false)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "var(--ink-soft)",
                    fontSize: "0.8rem",
                    padding: "0.4rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Plus tard (Accéder directement à mon CV débloqué)
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

          <div className="builder-brand-bar" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} title="Retour à l'accueil">
            <img src="/icon.jpg" alt="CV Tounsi Logo" style={{ width: "30px", height: "30px", borderRadius: "8px", objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
            <span>
              CV <b>Tounsi</b>
            </span>
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
                  <span>{user ? "Sauvegarder" : "Sauvegarder en ligne"}</span>
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

            {/* Client Status Badge (Only shown when unlocked) */}
            {isUnlocked && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {unlockedPlan === "year" ? (
                  <span
                    className="unlocked-pro-badge"
                    title={`Pass 1 An VIP · ${subscriptionInfo.fullDetails}`}
                    style={{ cursor: "help" }}
                  >
                    <Crown size={13} /> 👑 Pass 1 An ({subscriptionInfo.daysRemaining}j)
                  </span>
                ) : (
                  <span
                    className="unlocked-pro-badge"
                    style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0", cursor: "help" }}
                    title={`Pass 1 Mois · ${subscriptionInfo.fullDetails}`}
                  >
                    <Sparkles size={13} /> ⭐ Pass 1 Mois ({subscriptionInfo.daysRemaining}j)
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRelockForTest}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--ink-soft)",
                    fontSize: "0.68rem",
                    cursor: "pointer",
                  }}
                  title="Réinitialiser pour tester le mode verrouillé"
                >
                  (Test)
                </button>
              </div>
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
         LAYOUT 1: DESKTOP / PC (3-Column Layout with Sticky Live Preview)
         ════════════════════════════════════════════════════════════════════════ */}
      {!isMobileScreen ? (
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
                <strong>Statut :</strong>{" "}
                {isUnlocked ? (
                  unlockedPlan === "year" ? (
                    <div>
                      <span style={{ color: "#b45309", fontWeight: 800 }}>👑 Pass 1 An (VIP)</span>
                      <span style={{ display: "block", color: "#92400e", fontSize: "0.72rem", marginTop: "2px", fontWeight: 600 }}>
                        Expire le {subscriptionInfo.expiresAtFormatted} ({subscriptionInfo.daysRemaining}j restants)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ color: "#065f46", fontWeight: 800 }}>⭐ Pass 1 Mois</span>
                      <span style={{ display: "block", color: "#047857", fontSize: "0.72rem", marginTop: "2px", fontWeight: 600 }}>
                        Expire le {subscriptionInfo.expiresAtFormatted} ({subscriptionInfo.daysRemaining}j restants)
                      </span>
                    </div>
                  )
                ) : (
                  "🔒 Version Démo"
                )}
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
                isUnlocked={isCurrentCvUnlocked}
                isScreenProtected={isScreenProtected}
                onOpenPaywall={() => setShowPaywallModal(true)}
              />
            </div>
          </section>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════════
           LAYOUT 2: NATIVE MOBILE (Responsive Tabs: Formulaire / Aperçu Live)
           ════════════════════════════════════════════════════════════════════════ */
        <div className="native-mobile-builder">
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

                <button
                  type="button"
                  className="button ai-button"
                  onClick={improveCopy}
                  disabled={isGlobalLoading}
                  style={{ minWidth: "90px" }}
                >
                  <WandSparkles size={14} /> IA
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
                isUnlocked={isCurrentCvUnlocked}
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
      )}
    </main>
  );
}

const DRAFT_STORAGE_KEY = "cv_tounsi_live_draft_v3";

/* ─── Main Page ─── */
export default function Home() {
  const { user, openAuthModal, logout, savedCvs } = useAuth();
  const [isBuilder, setIsBuilder] = useState(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (
        search.includes("start=true") ||
        search.includes("builder=true") ||
        search.includes("ref=offre") ||
        search.includes("utm_source")
      ) {
        return true;
      }
      return localStorage.getItem("cv_tounsi_in_builder") === "true";
    }
    return false;
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [data, setData] = useState<CvData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && parsed.fullName !== undefined) {
            if (parsed.fullName === "Sarra Ben Salem" || parsed.email === "sarra.bensalem@email.com") {
              return blankCvData;
            }
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return blankCvData;
  });
  const [activeCvId, setActiveCvId] = useState<number | null>(null);
  const [isSavedCvsOpen, setIsSavedCvsOpen] = useState(false);

  // Auto-persist live draft on every change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }, [data]);

  // Auto-persist builder view mode and handle direct URL launch (Tâche 8)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (
        search.includes("start=true") ||
        search.includes("builder=true") ||
        search.includes("ref=offre") ||
        search.includes("utm_source")
      ) {
        if (!isBuilder) {
          setIsBuilder(true);
          trackBuilderStarted(data.template, data.language);
        }
      }
      localStorage.setItem("cv_tounsi_in_builder", isBuilder ? "true" : "false");
    }
  }, [isBuilder]);

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
      if (savedCv.isUnlocked && typeof window !== "undefined") {
        localStorage.setItem("cv_tounsi_student_unlocked_cv_id", String(savedCv.id));
      }
      setIsBuilder(true);
      toast.success(`CV "${savedCv.title}" chargé dans l'éditeur.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Erreur lors du chargement des données du CV.");
    }
  };

  const handleNewCv = () => {
    setData(blankCvData);
    setActiveCvId(null);
    setIsBuilder(true);
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.setItem("cv_tounsi_builder_step", "0");
      const currentStudentId = localStorage.getItem("cv_tounsi_student_unlocked_cv_id");
      if (currentStudentId === "primary_draft") {
        localStorage.setItem("cv_tounsi_student_unlocked_cv_id", "previous_draft_used");
      }
    }
    toast.info("Nouveau CV vierge initialisé.");
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
              style={{ display: "flex", alignItems: "center", gap: "9px" }}
            >
              <img src="/icon.jpg" alt="CV Tounsi Logo" style={{ width: "34px", height: "34px", borderRadius: "9px", objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
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
        onUpgradeToPro={() => {
          setIsSavedCvsOpen(false);
          setIsBuilder(true);
        }}
        unlockedPlan={
          typeof window !== "undefined"
            ? ((localStorage.getItem("cv_tounsi_client_plan") as any) || "student")
            : "student"
        }
      />

      {!isBuilder && (
        <footer className="site-footer">
          <div className="container footer-inner">
            <div className="brand footer-brand" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
              <img src="/icon.jpg" alt="CV Tounsi Logo" style={{ width: "28px", height: "28px", borderRadius: "7px", objectFit: "cover" }} />
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
