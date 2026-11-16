import { ref, computed } from 'vue';
import type { ThemeRealm } from '../types/portfolio';
import { getRealmIconAsset } from '../utils/portfolioLogic';

const STORAGE_KEY = 'portfolio_realm_v3';

function detectInitialTheme(): ThemeRealm {
  if (typeof window === 'undefined') return 'void';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'void' || saved === 'core') return saved;
  return 'void'; // Purple mode is now the default
}

const currentRealm = ref<ThemeRealm>(detectInitialTheme());
const isEldenMode = computed(() => currentRealm.value === 'void');

export function applyThemeToBody(realm: ThemeRealm) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (realm === 'core') {
    body.classList.remove('theme-void', 'theme-voidz', 'elden-realm');
    body.classList.add('theme-core');
  } else {
    body.classList.remove('theme-core');
    body.classList.add('theme-void', 'elden-realm');
  }

  const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
  if (favicon) {
    favicon.href = getRealmIconAsset(realm).src;
  }
}

export function useTheme() {
  function initTheme() {
    const initial = detectInitialTheme();
    currentRealm.value = initial;
    applyThemeToBody(initial);
  }

  function setTheme(next: ThemeRealm) {
    currentRealm.value = next;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    applyThemeToBody(next);
  }

  function toggleTheme() {
    const next: ThemeRealm = currentRealm.value === 'core' ? 'void' : 'core';
    setTheme(next);
  }

  return {
    realm: currentRealm,
    isEldenMode,
    initTheme,
    setTheme,
    toggleTheme,
  };
}
