import { defineStore } from 'pinia';

export interface Scenario {
  name: string; // unique
  watershed: string; // station name/id 
  tank: number; // volume
  soilInfiltration: number; // rate
  pavedArea: number; // percentage
  waterReuseIrrigation: boolean;
  waterReuseToilet: boolean;
}

export const useScenariiStore = defineStore('scenarii', () => {

  const scenarii = ref<Scenario[]>([]);

  function reset() {
    // TODO reset scenario
  }

  function makeScenario(name: string) {
    return {
      watershed: name,
      name: name,
      tank: 0,
      soilInfiltration: 0,
      pavedArea: 100,
      waterReuseIrrigation: false,
      waterReuseToilet: false,
    } as Scenario;
  }

  // add or update scenario
  function applyScenario(scenario: Scenario) {
    const idx = scenarii.value.findIndex((s) => s.watershed === scenario.watershed && s.name === scenario.name);
    if (idx < 0) {
      scenarii.value.push(scenario);
    } else {
      scenarii.value[idx] = scenario;
    }
    // TODO add computed line to charts
  }

  function removeScenario(watershed: string, name: string) {
    scenarii.value = scenarii.value.filter((s) => !(s.watershed === watershed && s.name === name));
    // TODO remove computed line from charts
  }

  return {
    scenarii,
    reset,
    makeScenario,
    applyScenario,
    removeScenario,
  }

}, { persist: true });