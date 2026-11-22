export type Locale = 'pt-br' | 'en';
export type ThemeRealm = 'core' | 'void';
export type SkillRank = 'S' | 'A' | 'B' | 'C' | 'D';
export type ChartType = 'bar' | 'radar' | 'polarArea';

export interface LocalizedText {
  'en': string;
  'pt-br': string;
}

export interface SkillLevelEntry {
  label: string;
  level: SkillRank;
  value: number;
}

export interface SkillIconEntry {
  type: 'devicon' | 'lucide';
  icon: string;
}

export interface SkillReference {
  key: string;
  type: 'devicon' | 'lucide';
}

export interface JobHistoryItem {
  id: string;
  company: string;
  role: LocalizedText;
  period: LocalizedText;
  description: LocalizedText;
  skills: SkillReference[];
}

export interface DevStats {
  name: string;
  startedCareer: string;
  specialization: LocalizedText;
  social_links: {
    github: string;
    linkedin: string;
    email: string;
    whatsapp: string;
  };
  history: JobHistoryItem[];
}

export interface ProjectTeamMember {
  name: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  avatar_url: string;
  role: LocalizedText;
}

export interface ProjectItem {
  title: string;
  type: LocalizedText;
  about: LocalizedText;
  images: string[];
  stack: SkillReference[];
  team: ProjectTeamMember[];
}

export interface EducationItem {
  title_key: string;
  provider_key: string;
  url: string;
  icon: string;
  hours: number | null;
  cert: string | null;
  proficiency?: number;
  proficiency_key?: string;
  flag?: string;
}

export interface EducationLogs {
  higher: EducationItem[];
  courses: EducationItem[];
  languages: EducationItem[];
}

export interface SeniorityLevel {
  years: string;
  label: 'Junior' | 'Pleno' | 'Senior';
  percent: string;
}

export interface ResolvedSkill {
  key: string;
  labelKey: string;
  label: string;
  icon: SkillIconEntry | string;
  level: SkillRank | null;
}

export interface TetrisRankingEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}
