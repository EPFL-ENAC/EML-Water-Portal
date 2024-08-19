import { defineStore } from 'pinia';

export type TimeseriesChartsParams = {
  timeRange: [Date, Date];
  axisPointer: Date | undefined;
  lastUpdatedChartID: string | undefined;
  MIN_DATE: Date;
  MAX_DATE: Date;
};

const MIN_DATE = new Date('2024-04-08T12:00:00.000Z');
const MAX_DATE = new Date('2024-07-15T00:00:00.000Z');
const MIN_DATE_MS = MIN_DATE.getTime();
const MAX_DATE_MS = MAX_DATE.getTime();
const DATE_RANGE_MS = MAX_DATE_MS - MIN_DATE_MS;

export const useTimeseriesChartsStore = defineStore('timeseriesCharts', () => {
  const timeRange = ref<[Date, Date]>([MIN_DATE, MAX_DATE]);
  const axisPointer = ref<Date | undefined>(undefined);
  const lastUpdatedChartID = ref<string | undefined>(undefined);

  function reset() {
    timeRange.value = [MIN_DATE, MAX_DATE];
    axisPointer.value = undefined;
    lastUpdatedChartID.value = undefined;
  }

  return {
    timeRange,
    axisPointer,
    lastUpdatedChartID,
    MIN_DATE,
    MAX_DATE,
    MIN_DATE_MS,
    MAX_DATE_MS,
    DATE_RANGE_MS,
    reset,
  };
});
