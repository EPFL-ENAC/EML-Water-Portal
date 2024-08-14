import { defineStore } from 'pinia';

export type FilterParams = {
  item?: boolean | null
}

export const useFiltersStore = defineStore('filters', () => {

  function reset() {
    // TODO reset filters
  }

  function asParams(): FilterParams {
    return {}
  }

  return {
    reset,
    asParams,
  }

}, { persist: true });