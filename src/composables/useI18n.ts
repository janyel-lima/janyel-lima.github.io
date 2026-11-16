import { ref, watch } from 'vue';
import type { Locale } from '../types/portfolio';
import { translateKey } from '../utils/portfolioLogic';
import { useTheme } from './useTheme';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'pt-br';
  const saved = localStorage.getItem('pref-lang');
  if (saved === 'pt-br' || saved === 'en') return saved;
  const nav = (navigator.language || 'pt-br').toLowerCase();
  return nav.startsWith('pt') ? 'pt-br' : 'en';
}

const currentLocale = ref<Locale>(detectLocale());

export function useI18n() {
  const { realm } = useTheme();

  function t(key: string): string {
    return translateKey(key, currentLocale.value, realm.value);
  }

  watch(
    [currentLocale, realm],
    () => {
      if (typeof document !== 'undefined') {
        document.title = translateKey('page_title', currentLocale.value, realm.value);
      }
    },
    { immediate: true }
  );

  function setLang(next: Locale) {
    const newLang: Locale = next === 'pt-br' ? 'pt-br' : 'en';
    if (currentLocale.value === newLang) return;
    currentLocale.value = newLang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pref-lang', newLang);
      document.title = t('page_title');
      window.dispatchEvent(
        new CustomEvent('i18n:changed', {
          detail: { lang: newLang },
        })
      );
    }
  }

  function toggleLang() {
    setLang(currentLocale.value === 'en' ? 'pt-br' : 'en');
  }

  return {
    lang: currentLocale,
    t,
    setLang,
    toggleLang,
  };
}
