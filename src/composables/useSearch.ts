import { ref } from 'vue';
import {
  matchSearchQuery,
  normalizeSearchText,
  type PortfolioSearchCategory,
  type PortfolioSearchResult,
} from '../utils/portfolioLogic';

const searchQuery = ref<string>(
  typeof window !== 'undefined' ? localStorage.getItem('search-q') || '' : ''
);
const searchOpen = ref<boolean>(false);
const activeCategory = ref<PortfolioSearchCategory>('all');

export function useSearch() {
  function persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('search-q', searchQuery.value || '');
    }
  }

  function clear() {
    searchQuery.value = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('search-q');
    }
  }

  function openSearch() {
    searchOpen.value = true;
  }

  function closeSearch() {
    searchOpen.value = false;
  }

  function toggleSearch() {
    searchOpen.value = !searchOpen.value;
  }

  function normalize(str: string): string {
    return normalizeSearchText(str);
  }

  function match(haystack: string): boolean {
    return matchSearchQuery(searchQuery.value, haystack);
  }

  function navigateToResult(result: PortfolioSearchResult) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('portfolio-search-navigate', { detail: result })
    );
    setTimeout(() => {
      const el = document.getElementById(result.targetSectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }

  return {
    q: searchQuery,
    isOpen: searchOpen,
    activeCategory,
    persist,
    clear,
    openSearch,
    closeSearch,
    toggleSearch,
    normalize,
    match,
    navigateToResult,
  };
}
