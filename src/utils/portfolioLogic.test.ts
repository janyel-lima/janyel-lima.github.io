import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevel,
  filterProjects,
  formatRadarLabel,
  getChartThemePalette,
  getPdfDisplayLabel,
  getRealmIconAsset,
  getResumeAsset,
  getVisibleStreamWindow,
  matchSearchQuery,
  normalizeSearchText,
  resolvePdfDocumentUrl,
  resolveSkill,
  translateKey,
} from './portfolioLogic';
import { myData } from '../data/portfolioData';

test('normalizeSearchText strips accents, lowercases, and normalizes separators', () => {
  assert.equal(normalizeSearchText('Análise_de-Sistemas!'), 'analise de sistemas!');
  assert.equal(normalizeSearchText('  Janyel   Lima '), 'janyel   lima');
});

test('matchSearchQuery matches normalized substrings and handles empty query', () => {
  assert.equal(matchSearchQuery('', 'Qualquer texto'), true);
  assert.equal(matchSearchQuery('mineração', 'Sistema Integrado de Gestão de Mineracao'), true);
  assert.equal(matchSearchQuery('inexistente', 'SIGMIN Java Spring'), false);
});

test('calculateLevel computes Junior, Pleno, and Senior tiers accurately', () => {
  const junior = calculateLevel('2025-01-01', new Date('2026-01-01'));
  assert.equal(junior.label, 'Junior');
  assert.equal(Number(junior.years), 1.0);

  const pleno = calculateLevel('2022-06-01', new Date('2026-01-01'));
  assert.equal(pleno.label, 'Pleno');

  const senior = calculateLevel('2021-01-04', new Date('2026-11-15'));
  assert.equal(senior.label, 'Senior');
  assert.equal(senior.percent, '100');
});

test('getVisibleStreamWindow wraps around circular project list properly', () => {
  const items = ['A', 'B', 'C', 'D'];
  assert.deepEqual(getVisibleStreamWindow(items, 0, 2), ['A', 'B']);
  assert.deepEqual(getVisibleStreamWindow(items, 3, 2), ['D', 'A']);
  assert.deepEqual(getVisibleStreamWindow([], 0, 2), []);
});

test('filterProjects filters by project title, stack, and team member name', () => {
  const byTitle = filterProjects(myData.projects, 'SIGMIN', 'pt-br');
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].title, 'SIGMIN - Sistema Integrado de Gestão de Mineração');

  const byTeam = filterProjects(myData.projects, 'Lázaro', 'pt-br');
  assert.equal(byTeam.length, 1);
  assert.equal(byTeam[0].title, 'Planeja Mais - MVP');
});

test('translateKey and resolveSkill return localized labels and mode-specific copy', () => {
  // Modern recruiter mode (Turquoise / core)
  assert.equal(translateKey('title_profile', 'pt-br', 'core'), '■ Perfil_Dev');
  assert.equal(translateKey('title_profile', 'en', 'core'), '■ Dev_Profile');

  // Traditional recruiter mode (Purple Elden Ring / void)
  assert.equal(translateKey('title_profile', 'pt-br', 'void'), 'Ficha do Profissional');
  assert.equal(translateKey('title_profile', 'en', 'void'), 'Professional Profile');
  assert.equal(translateKey('title_exp', 'pt-br', 'void'), 'Histórico e Experiência Profissional');
  assert.equal(translateKey('title_projects', 'en', 'void'), 'Featured Projects & Case Studies');
  assert.equal(translateKey('btn_theme', 'pt-br', 'void'), 'Troca de Reino');
  assert.equal(translateKey('btn_theme', 'en', 'void'), 'Realm Shift');
  assert.equal(
    translateKey('cv_pdf_viewer', 'pt-br', 'void'),
    'Currículo Profissional — Janyel B. Lima'
  );
  assert.equal(
    translateKey('cv_pdf_viewer', 'en', 'void'),
    'Curriculum Vitae — Janyel B. Lima'
  );
  assert.equal(translateKey('cv_pdf_viewer', 'pt-br', 'core'), 'CV_VIEWER.exe // CURRÍCULO');

  const vueSkill = resolveSkill('skill_vue', 'pt-br');
  assert.equal(vueSkill.label, 'Vue.js');
  assert.equal(vueSkill.level, 'A');
});

test('getResumeAsset and resolvePdfDocumentUrl handle both resume and certificate paths', () => {
  const ptResume = getResumeAsset('pt-br');
  assert.equal(ptResume.url, '/cv/cv-br.pdf');
  assert.equal(ptResume.filename, 'Curriculo-Janyel-Barbosa-Lima-PT-BR.pdf');
  assert.equal(ptResume.badge, 'PT-BR · PDF');
  assert.equal(resolvePdfDocumentUrl(ptResume.url), '/cv/cv-br.pdf');
  assert.equal(
    getPdfDisplayLabel(ptResume.url, ptResume.filename),
    'Curriculo-Janyel-Barbosa-Lima-PT-BR.pdf'
  );

  const enResume = getResumeAsset('en');
  assert.equal(enResume.url, '/cv/cv-en.pdf');
  assert.equal(enResume.filename, 'Resume-Janyel-Barbosa-Lima-EN.pdf');
  assert.equal(enResume.badge, 'EN · PDF');
  assert.equal(resolvePdfDocumentUrl(enResume.url), '/cv/cv-en.pdf');

  // Certificate bare filenames still resolve under /certs/
  assert.equal(resolvePdfDocumentUrl('alura-javascript.pdf'), '/certs/alura-javascript.pdf');
  assert.equal(getPdfDisplayLabel('/certs/alura-javascript.pdf'), 'alura-javascript.pdf');
});

test('getChartThemePalette returns Turquoise palette for core and Purple/Gold palette for void', () => {
  const corePalette = getChartThemePalette('core');
  assert.equal(corePalette.pointColor, '#00ffff');
  assert.ok(corePalette.top1.includes('0, 255, 255'));

  const voidPalette = getChartThemePalette('void');
  assert.equal(voidPalette.pointColor, '#e2c777');
  assert.ok(voidPalette.top1.includes('179, 102, 255'));
  assert.ok(voidPalette.selectedFill.includes('201, 168, 76'));
});

test('getRealmIconAsset returns Spectral Skull for core and Flor de Trina for void', () => {
  const coreIcon = getRealmIconAsset('core');
  assert.equal(coreIcon.src, '/img/cranio_espectral.svg');
  assert.equal(coreIcon.alt, 'Crânio Espectral');

  const voidIcon = getRealmIconAsset('void');
  assert.equal(voidIcon.src, '/img/flor_de_trina.svg');
  assert.equal(voidIcon.alt, 'Flor de Santa Trina');
});

test('formatRadarLabel wraps long multi-word labels to prevent radar chart clipping', () => {
  assert.equal(formatRadarLabel('Autonomy', 12), 'Autonomy');
  assert.deepEqual(formatRadarLabel('Emotional Intelligence', 12), [
    'Emotional',
    'Intelligence',
  ]);
  assert.deepEqual(formatRadarLabel('Pensamento Sistêmico', 12), [
    'Pensamento',
    'Sistêmico',
  ]);
});
