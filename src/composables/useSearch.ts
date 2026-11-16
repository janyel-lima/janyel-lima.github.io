import { ref } from 'vue';
import { matchSearchQuery, normalizeSearchText } from '../utils/portfolioLogic';

const searchQuery = ref<string>(
  typeof window !== 'undefined' ? localStorage.getItem('search-q') || '' : ''
);

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

  function normalize(str: string): string {
    return normalizeSearchText(str);
  }

  function match(haystack: string): boolean {
    return matchSearchQuery(searchQuery.value, haystack);
  }

  return {
    q: searchQuery,
    persist,
    clear,
    normalize,
    match,
  };
}
