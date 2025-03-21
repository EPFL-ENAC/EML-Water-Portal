import { defineStore } from 'pinia';
import { api } from 'src/boot/api';
import { ScenarioData } from 'src/models';

export interface Scenario {
  name: string; // unique
  watershed: string; // station name/id
  tank: number; // volume
  roofToTank: number; // fraction
  vegetation: string;
  flushingFrequency: number; // per hour
  useHistoricalData?: boolean;
  data?: ScenarioData;
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
        name: name,
        watershed: name,
        tank: 10,
        roofToTank: 0.5,
        vegetation: 'none',
        flushingFrequency: 2,
        useHistoricalData: false,
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
      updateScenarioData(scenario);
    }

    function removeScenario(scenario: Scenario) {
      scenarii.value = scenarii.value.filter(
        (s) =>
          !(s.watershed === scenario.watershed && s.name === scenario.name),
      );
    }

    async function updateScenarioData(scenario: Scenario) {
      api.get('scenarii/', {
        params: {
          name: scenario.name,
          watershed: scenario.watershed,
          tank: scenario.tank,
          roofToTank: scenario.roofToTank,
          vegetation: scenario.vegetation,
          flushingFrequency: scenario.flushingFrequency,
          // useHistoricalData: scenario.useHistoricalData,
        },
      }).then((response) => {
        scenario.data = response.data;
        console.log('scenario.data', scenario.data);
      });
    }

    async function updateScenariiData() {
      const promises: Promise<void>[] = [];
      scenarii.value.forEach((scenario) => {
        promises.push(updateScenarioData(scenario));
      });
      return Promise.all(promises);
    }

    return {
      scenarii,
      reset,
      makeScenario,
      applyScenario,
      removeScenario,
      updateScenariiData,
    };
  },
  { persist: true },
);
