import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevel,
  filterEducationSection,
  filterExperience,
  filterProjects,
  filterSkillEntries,
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
  searchPortfolio,
  translateKey,
} from './portfolioLogic';
import { devStats, educationLogs, myData, skillLevels } from '../data/portfolioData';

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

  const byStackLabel = filterProjects(myData.projects, 'PostgreSQL', 'pt-br');
  assert.ok(byStackLabel.length >= 3);
});

test('translateKey and resolveSkill return localized labels and mode-specific copy', () => {
  // Modern recruiter mode (Turquoise / core)
  assert.equal(translateKey('title_profile', 'pt-br', 'core'), '■ Perfil_Dev');
  assert.equal(translateKey('title_profile', 'en', 'core'), '■ Dev_Profile');

  // Traditional recruiter mode (Purple Elden Ring / void) — concise, objective labels
  assert.equal(translateKey('title_profile', 'pt-br', 'void'), 'Perfil');
  assert.equal(translateKey('title_profile', 'en', 'void'), 'Profile');
  assert.equal(translateKey('title_exp', 'pt-br', 'void'), 'Experiência Profissional');
  assert.equal(translateKey('title_projects', 'en', 'void'), 'Projects');
  assert.equal(translateKey('btn_theme', 'pt-br', 'void'), 'Troca de Reino');
  assert.equal(translateKey('btn_theme', 'en', 'void'), 'Realm Shift');
  assert.equal(
    translateKey('cv_pdf_viewer', 'pt-br', 'void'),
    'Currículo — Janyel B. Lima'
  );
  assert.equal(
    translateKey('cv_pdf_viewer', 'en', 'void'),
    'Resume — Janyel B. Lima'
  );
  assert.equal(translateKey('cv_pdf_viewer', 'pt-br', 'core'), 'CV_VIEWER.exe // CURRÍCULO');

  const vueSkill = resolveSkill('skill_vue', 'pt-br');
  assert.equal(vueSkill.label, 'Vue.js');
  assert.equal(vueSkill.level, 'A');
});

test('searchPortfolio and section filters search across all portfolio items in both modes', () => {
  // Full index when query is empty
  const allVoid = searchPortfolio('', 'pt-br', 'void');
  const allCore = searchPortfolio('', 'en', 'core');
  assert.ok(allVoid.length > 40);
  assert.equal(allVoid.length, allCore.length);

  // Search for experience company
  const andheResults = searchPortfolio('ANDHE', 'pt-br', 'void');
  assert.ok(andheResults.some((r) => r.category === 'experience' && r.title.includes('ANDHE')));
  assert.equal(filterExperience(devStats.history, 'ANDHE', 'pt-br').length, 1);

  // Search for course / certificate
  const greenBeltResults = searchPortfolio('Green Belt', 'pt-br', 'void');
  assert.ok(greenBeltResults.some((r) => r.category === 'education'));
  assert.equal(
    filterEducationSection(educationLogs.courses, 'courses', 'Green Belt', 'pt-br', 'void').length,
    1
  );

  // Search for skill
  const tsSkills = filterSkillEntries(skillLevels.hard, 'hard', 'TypeScript', 'pt-br', 'void');
  assert.ok('ts' in tsSkills);

  // Search for interactive Tetris demo or CV
  const tetrisResults = searchPortfolio('Tetris', 'pt-br', 'core');
  assert.ok(tetrisResults.some((r) => r.action.type === 'tetris'));
  const cvResults = searchPortfolio('Currículo PDF', 'pt-br', 'void');
  assert.ok(cvResults.some((r) => r.action.type === 'resume'));
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

import {
  computeCameraParallaxTarget,
  computePulseDisplacement,
  createInteractivePulse,
  dampValue,
  generateConstellationSegments,
  getRealmScenePalette,
} from './threeBackgroundLogic';

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

test('getRealmScenePalette and computeCameraParallaxTarget configure distinct 3D environments for core and void', () => {
  const corePalette = getRealmScenePalette('core');
  const voidPalette = getRealmScenePalette('void');

  assert.equal(corePalette.primaryHex, '#00ffff');
  assert.equal(voidPalette.accentHex, '#c9a84c');
  assert.ok(voidPalette.particleCount > corePalette.particleCount);

  const coreTarget = computeCameraParallaxTarget(0.5, -0.5, 400, corePalette);
  assert.ok(coreTarget.x > 0);
  assert.ok(coreTarget.y < 0);
  assert.ok(coreTarget.rotY < 0);

  // Damping smoothly interpolates toward target
  const damped = dampValue(0, coreTarget.x, 4.5, 0.016);
  assert.ok(damped > 0 && damped < coreTarget.x);
});

test('createInteractivePulse and computePulseDisplacement model tactical-lock in Turquoise and gravity-wave in Purple', () => {
  const tacticalLock = createInteractivePulse(1, 'core', 0, 0, 0);
  assert.equal(tacticalLock.type, 'tactical-lock');
  tacticalLock.age = tacticalLock.duration * 0.35;

  const lockDisp = computePulseDisplacement(3, 0, 0, tacticalLock);
  assert.ok(lockDisp.intensity > 0);
  assert.notEqual(lockDisp.dx, 0);

  const gravityWave = createInteractivePulse(2, 'void', 0, 0, 0);
  assert.equal(gravityWave.type, 'gravity-wave');
  gravityWave.age = gravityWave.duration * 0.4;

  const waveDisp = computePulseDisplacement(6, 0, 0, gravityWave);
  assert.ok(waveDisp.intensity > 0);
  assert.ok(waveDisp.dx > 0); // Pushes stars outward radially
});

test('generateConstellationSegments links nearby guide stars within distance bounds', () => {
  const coords = new Float32Array([
    0, 0, 0,
    8, 0, 0,
    0, 9, 0,
    50, 50, 50, // Too far to connect
  ]);
  const segments = generateConstellationSegments(coords, 4, 5.0, 12.0, 2);
  // Should connect (0,0,0)->(8,0,0) and (0,0,0)->(0,9,0), plus (8,0,0)->(0,9,0) = 3 segments * 6 floats = 18 floats
  assert.ok(segments.length >= 12);
  assert.equal(segments.length % 6, 0);
});

