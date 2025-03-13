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
      updateScenariiData();
    }

    function removeScenario(scenario: Scenario) {
      scenarii.value = scenarii.value.filter(
        (s) =>
          !(s.watershed === scenario.watershed && s.name === scenario.name),
      );
      // TODO remove computed line from charts
    }

    async function updateScenariiData() {
      const promises: Promise<void>[] = [];
      scenarii.value.forEach((scenario) => {
        if (scenario.data) {
          return;
        }
        promises.push(api.get('scenarii/', {
          params: {
            name: scenario.name,
            watershed: scenario.watershed,
            tank: scenario.tank,
            roofToTank: scenario.roofToTank,
            vegetation: scenario.vegetation,
            flushingFrequency: scenario.flushingFrequency,
          },
        }).then((response) => {
          scenario.data = response.data;
          console.log('scenario.data', scenario.data);
        }));
      });
      return Promise.all(promises);
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
