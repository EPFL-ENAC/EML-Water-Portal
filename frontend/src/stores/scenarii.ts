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
  lineColor: string;
  useCustomPercentPaved: boolean;
  customPercentPaved?: number; // 0-100
  useHistoricalData?: boolean;
  data?: ScenarioData;
}

export const colors = ['#333288', '#88ccee', '#44aa99', '#117733', '#999933', '#ddcc77', '#cc6677', '#882255', '#aa4499', '#dddddd'];

export const useScenariiStore = defineStore(
  'scenarii',
  () => {
    const scenarii = ref<Scenario[]>([]);
    // Paul Tol's "muted" color scheme

    function reset() {
      // TODO reset scenario
    }

    function getNewScenarioColor(): string {
      const index = scenarii.value.length % colors.length;
      return colors[index];
    }

    function makeScenario(name: string) {
      return {
        name: name,
        watershed: name,
        tank: 10,
        roofToTank: 0.5,
        vegetation: 'none',
        flushingFrequency: 2,
        lineColor: getNewScenarioColor(),
        useCustomPercentPaved: false,
        customPercentPaved: 70,
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
          customPercentPaved: scenario.useCustomPercentPaved ? scenario.customPercentPaved : undefined,
          // useHistoricalData: scenario.useHistoricalData,
        },
      }).then((response) => {
        scenario.data = response.data;
        scenario.data.lineColor = scenario.lineColor;
        // console.log('scenario.data', scenario.data);
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
