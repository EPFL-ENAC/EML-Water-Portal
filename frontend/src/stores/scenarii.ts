import { defineStore } from 'pinia';

export interface Scenario {
  name: string; // unique
  watershed: string; // station name/id
  tank: number; // volume
  roofToTank: number; // fraction
  vegetation: string;
  flushingFrequency: number; // per hour
}

export const useScenariiStore = defineStore(
  'scenarii',
  () => {
    const scenarii = ref<Scenario[]>([]);

    function reset() {
      // TODO reset scenario
    }

    function makeScenario(name: string) {
      return {
        watershed: name,
        name: name,
        tank: 10,
        roofToTank: 0.5,
        vegetation: 'none',
        flushingFrequency: 2,
      } as Scenario;
    }

    // add or update scenario
    function applyScenario(name: string, scenario: Scenario) {
      const idx = scenarii.value.findIndex(
        (s) => s.watershed === scenario.watershed && s.name === name,
      );
      if (idx < 0) {
        scenarii.value.push(scenario);
      } else {
        scenarii.value[idx] = scenario;
      }
      // TODO add computed line to charts
    }

    function removeScenario(scenario: Scenario) {
      scenarii.value = scenarii.value.filter(
        (s) =>
          !(s.watershed === scenario.watershed && s.name === scenario.name),
      );
      // TODO remove computed line from charts
    }

    return {
      scenarii,
      reset,
      makeScenario,
      applyScenario,
      removeScenario,
    };
  },
  { persist: true },
);
