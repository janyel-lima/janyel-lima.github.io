import type {
  EducationItem,
  JobHistoryItem,
  Locale,
  ProjectItem,
  ResolvedSkill,
  SeniorityLevel,
  SkillLevelEntry,
  ThemeRealm,
} from '../types/portfolio';
import {
  DEFAULT_ICON,
  devStats,
  educationLogs,
  myData,
  skillIcons,
  skillLevels,
} from '../data/portfolioData';
import { getModeSpecificMessage } from '../data/i18n';

export type PortfolioSearchCategory =
  | 'all'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'education'
  | 'profile';

export interface PortfolioSearchAction {
  type:
    | 'project'
    | 'experience'
    | 'skill'
    | 'education'
    | 'profile'
    | 'resume'
    | 'contact'
    | 'tetris';
  key?: string;
  subKey?: string;
  index?: number;
}

export interface PortfolioSearchResult {
  id: string;
  category: Exclude<PortfolioSearchCategory, 'all'>;
  title: string;
  subtitle: string;
  badge?: string;
  targetSectionId: string;
  action: PortfolioSearchAction;
}

export interface ResumeAssetInfo {
  url: string;
  filename: string;
  badge: string;
}

export interface ChartThemePalette {
  top1: string;
  top2: string;
  top3: string;
  default: string;
  selectedFill: string;
  selectedBorder: string;
  borderTop: string;
  borderDefault: string;
  radarFill: string;
  radarBorder: string;
  pointColor: string;
  gridHighlight: string;
  gridDefault: string;
  tickHighlight: string;
  tickLabel: string;
  tooltipBg: string;
  exportBg: string;
}

export function normalizeSearchText(str: string | null | undefined): string {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\-]+/g, ' ')
    .trim();
}

export function matchSearchQuery(query: string, haystack: string): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;
  const normHaystack = normalizeSearchText(haystack);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => normHaystack.includes(token));
}

export function filterProjects(
  projects: ProjectItem[],
  query: string,
  lang: Locale
): ProjectItem[] {
  if (!normalizeSearchText(query)) return projects;
  return projects.filter((p) => {
    const stackLabels = (p.stack ?? []).flatMap((s) => [
      s.key,
      translateKey(`skills.${s.key}`, lang, 'core'),
      translateKey(`skills.${s.key}`, 'pt-br', 'core'),
      translateKey(`skills.${s.key}`, 'en', 'core'),
    ]);
    const teamTexts = (p.team ?? []).flatMap((m) => [
      m.name,
      m.role?.['pt-br'],
      m.role?.['en'],
    ]);
    const text = [
      p.title,
      p.type?.[lang],
      p.type?.['pt-br'],
      p.type?.['en'],
      p.about?.[lang],
      p.about?.['pt-br'],
      p.about?.['en'],
      ...stackLabels,
      ...teamTexts,
    ].join(' ');
    return matchSearchQuery(query, text);
  });
}

export function filterExperience(
  history: JobHistoryItem[],
  query: string,
  lang: Locale
): JobHistoryItem[] {
  if (!normalizeSearchText(query)) return history;
  return history.filter((job) => {
    const skillLabels = (job.skills ?? []).flatMap((s) => [
      s.key,
      translateKey(`skills.${s.key}`, lang, 'core'),
      translateKey(`skills.${s.key}`, 'pt-br', 'core'),
      translateKey(`skills.${s.key}`, 'en', 'core'),
    ]);
    const text = [
      job.company,
      job.role?.[lang],
      job.role?.['pt-br'],
      job.role?.['en'],
      job.period?.[lang],
      job.description?.[lang],
      job.description?.['pt-br'],
      job.description?.['en'],
      ...skillLabels,
    ].join(' ');
    return matchSearchQuery(query, text);
  });
}

export function filterSkillEntries(
  entries: Record<string, SkillLevelEntry>,
  category: 'hard' | 'soft',
  query: string,
  lang: Locale,
  realm: ThemeRealm = 'void'
): Record<string, SkillLevelEntry> {
  if (!normalizeSearchText(query)) return entries;
  const catKeywords =
    category === 'hard'
      ? 'hard skills tecnicas habilidades competencias tecnologia'
      : 'soft skills comportamentais interpessoais habilidades competencias';

  const out: Record<string, SkillLevelEntry> = {};
  for (const [k, data] of Object.entries(entries)) {
    const labelPt = translateKey(`skills.${data.label}`, 'pt-br', realm);
    const labelEn = translateKey(`skills.${data.label}`, 'en', realm);
    const rankMeaning = translateKey(`levels.${data.level}`, lang, realm);
    const haystack = [
      k,
      data.label,
      data.level,
      `rank ${data.level}`,
      labelPt,
      labelEn,
      rankMeaning,
      catKeywords,
    ].join(' ');
    if (matchSearchQuery(query, haystack)) {
      out[k] = data;
    }
  }
  return out;
}

export function filterEducationSection(
  items: EducationItem[],
  sectionKey: string,
  query: string,
  lang: Locale,
  realm: ThemeRealm = 'void'
): EducationItem[] {
  if (!normalizeSearchText(query)) return items;
  const sectionLabelPt =
    sectionKey === 'higher'
      ? 'graduacao educacao superior faculdade universidade'
      : sectionKey === 'languages'
        ? 'idiomas linguas languages'
        : 'cursos certificados certificacoes';

  return items.filter((item) => {
    const haystack = [
      sectionLabelPt,
      translateKey(item.title_key, lang, realm),
      translateKey(item.title_key, 'pt-br', realm),
      translateKey(item.title_key, 'en', realm),
      translateKey(item.provider_key, lang, realm),
      translateKey(item.provider_key, 'pt-br', realm),
      translateKey(item.provider_key, 'en', realm),
      item.proficiency_key ? translateKey(item.proficiency_key, lang, realm) : '',
      item.hours ? `${item.hours}h` : '',
      item.cert ? `certificado pdf ${item.cert}` : '',
    ].join(' ');
    return matchSearchQuery(query, haystack);
  });
}

export function searchPortfolio(
  query: string,
  lang: Locale,
  realm: ThemeRealm = 'void'
): PortfolioSearchResult[] {
  const results: PortfolioSearchResult[] = [];
  const hasQuery = Boolean(normalizeSearchText(query));

  // 1. Projects
  myData.projects.forEach((p, idx) => {
    const stackNames = (p.stack ?? []).map((s) =>
      translateKey(`skills.${s.key}`, lang, realm)
    );
    const teamNames = (p.team ?? []).map((m) => m.name);
    const haystack = [
      'projeto project portfolio case',
      p.title,
      p.type?.['pt-br'],
      p.type?.['en'],
      p.about?.['pt-br'],
      p.about?.['en'],
      ...stackNames,
      ...(p.stack ?? []).map((s) => s.key),
      ...teamNames,
      ...(p.team ?? []).flatMap((m) => [m.role?.['pt-br'], m.role?.['en']]),
    ].join(' ');

    if (!hasQuery || matchSearchQuery(query, haystack)) {
      results.push({
        id: `project-${idx}`,
        category: 'projects',
        title: p.title,
        subtitle: [p.type?.[lang], stackNames.slice(0, 4).join(' · ')]
          .filter(Boolean)
          .join(' — '),
        badge: translateKey('search_cat_projects', lang, realm),
        targetSectionId: 'projects',
        action: { type: 'project', index: idx, key: p.title },
      });
    }
  });

  // 2. Experience Timeline
  devStats.history.forEach((job) => {
    const skillNames = (job.skills ?? []).map((s) =>
      translateKey(`skills.${s.key}`, lang, realm)
    );
    const haystack = [
      'experiencia trabalho carreira cargo empresa work experience job role',
      job.company,
      job.role?.['pt-br'],
      job.role?.['en'],
      job.period?.['pt-br'],
      job.description?.['pt-br'],
      job.description?.['en'],
      ...skillNames,
    ].join(' ');

    if (!hasQuery || matchSearchQuery(query, haystack)) {
      results.push({
        id: `exp-${job.id}`,
        category: 'experience',
        title: `${job.role[lang]} · ${job.company}`,
        subtitle: `${job.period[lang]} — ${skillNames.slice(0, 4).join(', ')}`,
        badge: job.period[lang].split(' ')[0],
        targetSectionId: 'exp',
        action: { type: 'experience', key: job.id },
      });
    }
  });

  // 3. Skills (Hard & Soft)
  const addSkillResults = (
    entries: Record<string, SkillLevelEntry>,
    subCategory: 'hard' | 'soft'
  ) => {
    const catLabel = translateKey(
      subCategory === 'hard' ? 'hard_skills' : 'soft_skills',
      lang,
      realm
    );
    for (const [k, data] of Object.entries(entries)) {
      const label = translateKey(`skills.${data.label}`, lang, realm);
      const labelPt = translateKey(`skills.${data.label}`, 'pt-br', realm);
      const labelEn = translateKey(`skills.${data.label}`, 'en', realm);
      const rankDesc = translateKey(`levels.${data.level}`, lang, realm);
      const haystack = [
        'skill habilidade competencia',
        subCategory === 'hard'
          ? 'hard tecnica tecnologia'
          : 'soft interpessoal comportamental',
        k,
        label,
        labelPt,
        labelEn,
        `rank ${data.level}`,
        rankDesc,
      ].join(' ');

      if (!hasQuery || matchSearchQuery(query, haystack)) {
        results.push({
          id: `skill-${subCategory}-${k}`,
          category: 'skills',
          title: label,
          subtitle: `${catLabel} · ${rankDesc}`,
          badge: `Rank ${data.level}`,
          targetSectionId: 'skills-subsystem',
          action: { type: 'skill', key: k, subKey: subCategory },
        });
      }
    }
  };
  addSkillResults(skillLevels.hard, 'hard');
  addSkillResults(skillLevels.soft, 'soft');

  // 4. Education, Courses & Languages
  (Object.keys(educationLogs) as Array<keyof typeof educationLogs>).forEach(
    (sectionKey) => {
      const items = educationLogs[sectionKey];
      const secTitle = translateKey(
        sectionKey === 'higher'
          ? 'higher_education'
          : sectionKey === 'languages'
            ? 'edu_languages'
            : 'courses',
        lang,
        realm
      );
      items.forEach((item) => {
        const title = translateKey(item.title_key, lang, realm);
        const provider = translateKey(item.provider_key, lang, realm);
        const prof = item.proficiency_key
          ? translateKey(item.proficiency_key, lang, realm)
          : '';
        const haystack = [
          'formacao educacao curso certificado idioma faculdade graduacao',
          secTitle,
          title,
          translateKey(item.title_key, 'pt-br', realm),
          translateKey(item.title_key, 'en', realm),
          provider,
          translateKey(item.provider_key, 'pt-br', realm),
          translateKey(item.provider_key, 'en', realm),
          prof,
          item.hours ? `${item.hours}h` : '',
          item.cert ? `certificado pdf ${item.cert}` : '',
        ].join(' ');

        if (!hasQuery || matchSearchQuery(query, haystack)) {
          results.push({
            id: `edu-${sectionKey}-${item.title_key}`,
            category: 'education',
            title,
            subtitle: [
              provider,
              item.hours ? `${item.hours}h` : '',
              prof,
            ]
              .filter(Boolean)
              .join(' · '),
            badge: secTitle,
            targetSectionId: 'education-archive',
            action: {
              type: 'education',
              key: item.title_key,
              subKey: String(sectionKey),
            },
          });
        }
      });
    }
  );

  // 5. Profile, Bio, Resume PDF, Contact Channels & Interactive Tetris Challenge
  const levelInfo = calculateLevel(devStats.startedCareer);
  const profileItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    haystack: string;
    targetSectionId: string;
    action: PortfolioSearchAction;
  }> = [
    {
      id: 'profile-summary',
      title: `${devStats.name} — ${devStats.specialization[lang]}`,
      subtitle: translateKey('about_me_text', lang, realm).slice(0, 110) + '…',
      badge: translateKey('title_profile', lang, realm),
      haystack: [
        'perfil sobre mim bio resumo senioridade experiencia disponivel contratacao',
        devStats.name,
        devStats.specialization['pt-br'],
        devStats.specialization['en'],
        `${levelInfo.years} anos years senior`,
        translateKey('about_me_text', 'pt-br', realm),
        translateKey('about_me_text', 'en', realm),
      ].join(' '),
      targetSectionId: 'profile-card',
      action: { type: 'profile' },
    },
    {
      id: 'profile-resume',
      title: translateKey('btn_cv', lang, realm),
      subtitle: `${getResumeAsset(lang).filename} (${getResumeAsset(lang).badge})`,
      badge: 'PDF / CV',
      haystack:
        'curriculo cv pdf download baixar visualizar resume curriculum vitae documento',
      targetSectionId: 'profile-card',
      action: { type: 'resume' },
    },
    {
      id: 'profile-contact',
      title: `${translateKey('title_contact', lang, realm)} & ${translateKey('title_network', lang, realm)}`,
      subtitle: 'WhatsApp · E-mail (janyel.lima2809@outlook.com) · LinkedIn · GitHub',
      badge: translateKey('title_contact', lang, realm),
      haystack:
        'contato whatsapp email e-mail linkedin github redes sociais telefone mensagem entrevista contratar',
      targetSectionId: 'contact-section',
      action: { type: 'contact' },
    },
    {
      id: 'profile-tetris',
      title: translateKey('challenge_title', lang, realm),
      subtitle: translateKey('challenge_body', lang, realm),
      badge: 'Canvas 2D',
      haystack:
        'tetris mini-jogo minigame jogo game desafio recruiter challenge demo interativa canvas typescript',
      targetSectionId: 'tetris-challenge',
      action: { type: 'tetris' },
    },
  ];

  for (const item of profileItems) {
    if (!hasQuery || matchSearchQuery(query, `${item.title} ${item.subtitle} ${item.haystack}`)) {
      results.push({
        id: item.id,
        category: 'profile',
        title: item.title,
        subtitle: item.subtitle,
        badge: item.badge,
        targetSectionId: item.targetSectionId,
        action: item.action,
      });
    }
  }

  return results;
}

export function getVisibleStreamWindow<T>(
  items: T[],
  cursor: number,
  windowSize: number
): T[] {
  const total = items.length;
  if (!total) return [];
  const count = Math.min(windowSize, total);
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const idx = ((cursor + i) % total + total) % total;
    out.push(items[idx]);
  }
  return out;
}

export function calculateLevel(
  startedCareer: string = devStats.startedCareer,
  nowDate: Date = new Date()
): SeniorityLevel {
  const start = new Date(startedCareer);
  const years = (nowDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  let label: 'Junior' | 'Pleno' | 'Senior' = 'Junior';
  let progress = 0;

  if (years >= 5) {
    label = 'Senior';
    progress = 100;
  } else if (years >= 2) {
    label = 'Pleno';
    progress = ((years - 2) / 3) * 100;
  } else {
    label = 'Junior';
    progress = Math.max(0, (years / 2) * 100);
  }

  return {
    years: Math.max(0, years).toFixed(1),
    label,
    percent: Math.min(Math.max(progress, 0), 100).toFixed(0),
  };
}

export function translateKey(
  key: string,
  lang: Locale,
  realm: ThemeRealm = 'void'
): string {
  const val: any = getModeSpecificMessage(key, lang, realm);

  if (
    val &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    ('en' in val || 'pt-br' in val)
  ) {
    return val[lang] ?? val.en ?? val['pt-br'] ?? key;
  }

  return typeof val === 'string' ? val : key;
}

export function resolveSkill(skillKey: string, lang: Locale): ResolvedSkill {
  const normalizedKey = skillKey.replace(/^skill_/, '').replace(/^soft_/, '');
  const level =
    skillLevels.hard[normalizedKey] ||
    skillLevels.soft[normalizedKey] ||
    Object.values(skillLevels.hard).find((s) => s.label === skillKey) ||
    Object.values(skillLevels.soft).find((s) => s.label === skillKey);

  const labelKey = level?.label ?? skillKey;
  return {
    key: skillKey,
    labelKey,
    label: translateKey(`skills.${labelKey}`, lang),
    icon: skillIcons[labelKey] ?? DEFAULT_ICON,
    level: level?.level ?? null,
  };
}

export function getResumeAsset(lang: Locale): ResumeAssetInfo {
  if (lang === 'pt-br') {
    return {
      url: '/cv/cv-br.pdf',
      filename: 'Curriculo-Janyel-Barbosa-Lima-PT-BR.pdf',
      badge: 'PT-BR · PDF',
    };
  }
  return {
    url: '/cv/cv-en.pdf',
    filename: 'Resume-Janyel-Barbosa-Lima-EN.pdf',
    badge: 'EN · PDF',
  };
}

export function resolvePdfDocumentUrl(file: string): string {
  const clean = String(file ?? '').trim();
  if (!clean) return '';
  if (clean.startsWith('/') || /^https?:\/\//i.test(clean)) {
    return clean;
  }
  return `/certs/${clean}`;
}

export function getPdfDisplayLabel(file: string, customLabel?: string): string {
  if (customLabel && customLabel.trim()) {
    return customLabel.trim();
  }
  const clean = String(file ?? '').trim();
  const parts = clean.split('/').filter(Boolean);
  return parts[parts.length - 1] || clean;
}

export interface RealmIconAsset {
  src: string;
  alt: string;
}

export function getRealmIconAsset(realm: ThemeRealm): RealmIconAsset {
  if (realm === 'void') {
    return {
      src: '/img/flor_de_trina.svg',
      alt: 'Flor de Santa Trina',
    };
  }
  return {
    src: '/img/cranio_espectral.svg',
    alt: 'Crânio Espectral',
  };
}

export function getChartThemePalette(realm: ThemeRealm): ChartThemePalette {
  if (realm === 'void') {
    return {
      top1: 'rgba(179, 102, 255, 0.78)',
      top2: 'rgba(155, 77, 235, 0.65)',
      top3: 'rgba(132, 56, 212, 0.54)',
      default: 'rgba(88, 28, 135, 0.45)',
      selectedFill: 'rgba(201, 168, 76, 0.88)',
      selectedBorder: 'rgba(243, 224, 155, 1)',
      borderTop: 'rgba(201, 168, 76, 0.92)',
      borderDefault: 'rgba(179, 102, 255, 0.68)',
      radarFill: 'rgba(168, 85, 247, 0.28)',
      radarBorder: 'rgba(192, 132, 252, 0.88)',
      pointColor: '#e2c777',
      gridHighlight: 'rgba(201, 168, 76, 0.42)',
      gridDefault: 'rgba(179, 102, 255, 0.16)',
      tickHighlight: 'rgba(226, 199, 119, 0.95)',
      tickLabel: 'rgba(243, 239, 230, 0.95)',
      tooltipBg: 'rgba(14, 7, 26, 0.96)',
      exportBg: '#090512',
    };
  }

  return {
    top1: 'rgba(0, 255, 255, 0.72)',
    top2: 'rgba(0, 220, 220, 0.60)',
    top3: 'rgba(0, 180, 180, 0.48)',
    default: 'rgba(7, 123, 128, 0.42)',
    selectedFill: 'rgba(0, 255, 255, 0.95)',
    selectedBorder: 'rgba(255, 255, 255, 1)',
    borderTop: 'rgba(0, 255, 255, 0.95)',
    borderDefault: 'rgba(8, 196, 202, 0.62)',
    radarFill: 'rgba(7, 123, 128, 0.26)',
    radarBorder: 'rgba(8, 196, 202, 0.78)',
    pointColor: '#00ffff',
    gridHighlight: 'rgba(0, 255, 255, 0.35)',
    gridDefault: 'rgba(255, 255, 255, 0.12)',
    tickHighlight: 'rgba(0, 255, 255, 0.92)',
    tickLabel: 'rgba(255, 255, 255, 0.95)',
    tooltipBg: 'rgba(5, 20, 30, 0.94)',
    exportBg: '#001820',
  };
}

export function formatRadarLabel(label: string, maxLineLength = 12): string | string[] {
  const clean = String(label ?? '').trim();
  if (clean.length <= maxLineLength || !clean.includes(' ')) {
    return clean;
  }
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxLineLength) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 1 ? lines : clean;
}

export const IMAGE_FALLBACK = 'https://placehold.co/600x400/1a0b33/ab34fa?text=Asset+Missing';

export function handleImageError(e: Event) {
  const img = e?.target as HTMLImageElement | null;
  if (!img) return;

  img.onerror = null;
  img.src = IMAGE_FALLBACK;
  img.classList.add('grayscale', 'opacity-20');
}
