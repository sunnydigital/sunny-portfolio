// Resume data shared between the long-form Resume component and the
// hill-anchored ResumeJournal. The editor in Resume.tsx mutates a localStorage
// copy of this same shape; the journal reads either localStorage or these
// defaults, whichever is present at render time.

export interface Experience {
  title: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  school: string;
  period: string;
  detail: string;
}

export interface Certification {
  title: string;
  org: string;
  url: string;
}

export interface Language {
  lang: string;
  level: string;
}

export interface ResumeData {
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  interests: string[];
}

export const DEFAULT_EXPERIENCE: Experience[] = [
  {
    title: "Machine Learning Engineer",
    company: "Globalink AI Inc",
    location: "Remote (Calabasas, CA)",
    period: "Feb 2026 – Present",
    bullets: [
      "Designing an agentic BI decision engine combining ML models, LLMs, and Knowledge Graphs to generate actionable e-commerce merchant recommendations, reasoning across competing objectives including growth, margin optimization, and inventory risk",
      "Architecting inference pipeline integrating Knowledge Graph constraint modeling with LLM-driven reasoning to produce explainable, constraint-aware decisions on pricing, ad allocation, and SKU management",
      "Developing an evaluation framework measuring decision quality through merchant outcome metrics, A/B-tested recommendation lift, and consistency audits, leveraging few-shot learning and Bayesian updating for reliable decisions from limited operational data",
    ],
  },
  {
    title: "AI Engineer Intern",
    company: "Amazon",
    location: "Los Angeles, CA",
    period: "Jun 2025 – Aug 2025",
    bullets: [
      "Engineered an enterprise-scale RAG LLM system serving 15,000 tables across 200 schemas, reducing data discovery time by 75% with automated DDL generation and intelligent table/column comments using AWS S3, Knowledge Bases, Redshift, and Bedrock",
      "Pioneered version control for data infrastructure by implementing git-style versioning with md5 hash-based difference tracking, enabling rollback capabilities and reducing schema conflicts by 60%",
      "Built an automated notification system with Slack API integration, cutting manual monitoring overhead by 90% and providing real-time updates on daily table schema modifications",
    ],
  },
  {
    title: "Data Scientist",
    company: "NYU Langone Health",
    location: "New York, NY",
    period: "May 2023 – May 2025",
    bullets: [
      "Implemented deep learning computer vision models using U-Net convolutional neural network architectures with transfer learning, achieving 15% improvement in image segmentation accuracy for medical imaging analysis of over 2,000 microscopy samples",
      "Designed an end-to-end machine learning pipeline for biomedical data preprocessing, reducing processing time from 8 hours to 45 minutes while maintaining over 90% data quality through feature engineering and data augmentation techniques",
      "Conducted pathway analysis to identify key biological pathways involved in glucose and lipid uptake, transport, and oxidation, offering insights for targeted therapeutic interventions and contributing to advancements in cardiovascular research",
      "Streamlined bioinformatics pipelines by composing 2,000 lines of R code, facilitating comprehensive analysis of datasets with over 300,000 records, improving processing from 10 hours to 8.5 hours and ensuring reproducibility and reusability",
      "Implemented dimensionality reduction and spacio-temporal modeling to bridge theoretical gaps with trajectory inference, elucidating the impact of CXCL12's interaction with CXCR4, ACKR3 receptors in maintaining CD8+ T Cell presence within tumors",
    ],
  },
];

export const DEFAULT_EDUCATION: Education[] = [
  {
    degree: "MS Data Science",
    school: "New York University Center for Data Science",
    period: "May 2026",
    detail: "GPA: 3.63 / 4.0",
  },
  {
    degree: "BS Business",
    school: "New York University Leonard N. Stern School of Business",
    period: "May 2023",
    detail: "GPA: 3.73 / 4.0",
  },
];

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  { title: "Machine Learning Engineering for Production (MLOps) Specialization", org: "DeepLearning.AI", url: "https://www.coursera.org/account/accomplishments/specialization/certificate/5MY8NWK6CAJH" },
];

export const DEFAULT_INTERESTS = [
  "Running", "Photography", "Overwatch (Top 500)", "Smash Bros.", "Boarding",
  "Weight Training", "Calisthenics", "Travel", "Street Food", "Archery",
  "Counter Strike", "Whistling (Taking Requests)",
];

export const DEFAULT_LANGUAGES: Language[] = [
  { lang: "Mandarin", level: "Proficient" },
  { lang: "Spanish", level: "Elementary" },
  { lang: "Japanese", level: "Elementary" },
];

export const RESUME_STORAGE_KEY = "resume-edit";

export function loadResumeData(): ResumeData {
  const fallback: ResumeData = {
    experience: DEFAULT_EXPERIENCE,
    education: DEFAULT_EDUCATION,
    certifications: DEFAULT_CERTIFICATIONS,
    languages: DEFAULT_LANGUAGES,
    interests: DEFAULT_INTERESTS,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(RESUME_STORAGE_KEY);
    if (!saved) return fallback;
    const d = JSON.parse(saved) as Partial<ResumeData>;
    return {
      experience: d.experience?.length ? d.experience : DEFAULT_EXPERIENCE,
      education: d.education?.length ? d.education : DEFAULT_EDUCATION,
      certifications: d.certifications?.length ? d.certifications : DEFAULT_CERTIFICATIONS,
      languages: d.languages?.length ? d.languages : DEFAULT_LANGUAGES,
      interests: d.interests?.length ? d.interests : DEFAULT_INTERESTS,
    };
  } catch {
    return fallback;
  }
}
