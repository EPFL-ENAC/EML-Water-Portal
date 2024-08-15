import { defineStore } from 'pinia';

export type TimeseriesChartsParams = {
  timeRange: [Date, Date];
  axisPointer: Date | undefined;
  MIN_DATE: Date;
  MAX_DATE: Date;
};

const MIN_DATE = new Date('2024-04-08T12:00:00.000Z');
const MAX_DATE = new Date('2024-07-15T00:00:00.000Z');

export const useTimeseriesChartsStore = defineStore('timeseriesCharts', () => {
  const timeRange = ref<[Date, Date]>([MIN_DATE, MAX_DATE]);
  const axisPointer = ref<Date | undefined>(undefined);

  function reset() {
    timeRange.value = [MIN_DATE, MAX_DATE];
    axisPointer.value = undefined;
  }

  return {
    timeRange,
    axisPointer,
    MIN_DATE,
    MAX_DATE,
    reset,
  };
});
