import type {
  Locale,
  ProjectItem,
  ResolvedSkill,
  SeniorityLevel,
  ThemeRealm,
} from '../types/portfolio';
import { DEFAULT_ICON, devStats, skillIcons, skillLevels } from '../data/portfolioData';
import { getModeSpecificMessage } from '../data/i18n';

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
  return normalizeSearchText(haystack).includes(q);
}

export function filterProjects(
  projects: ProjectItem[],
  query: string,
  lang: Locale
): ProjectItem[] {
  if (!normalizeSearchText(query)) return projects;
  return projects.filter((p) => {
    const text = [
      p.title,
      p.type?.[lang],
      p.about?.[lang],
      ...(p.stack?.map((x) => x.key) ?? []),
      ...(p.team?.map((x) => x.name) ?? []),
    ].join(' ');
    return matchSearchQuery(query, text);
  });
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

const REALM_ICON_FALLBACK_CHAIN: Record<string, string[]> = {
  '/img/flor_de_trina.svg': ['/assets/aistudio/flor_de_trina_68f974e8.svg', '/img/core.png'],
  '/img/cranio_espectral.svg': ['/assets/aistudio/cranio_espectral_28efb91a.svg', '/img/skull.png'],
};

export function handleImageError(e: Event) {
  const img = e?.target as HTMLImageElement | null;
  if (!img) return;

  const currentSrc = img.getAttribute('src') || '';
  for (const [primary, chain] of Object.entries(REALM_ICON_FALLBACK_CHAIN)) {
    if (currentSrc === primary || chain.includes(currentSrc)) {
      const idx = currentSrc === primary ? 0 : chain.indexOf(currentSrc) + 1;
      if (idx < chain.length) {
        img.src = chain[idx];
        return;
      }
    }
  }

  img.onerror = null;
  img.src = IMAGE_FALLBACK;
  img.classList.add('grayscale', 'opacity-20');
}
