import type { Datasets, SensorData } from 'src/models';
import { api } from 'src/boot/api';
import { roundToNearestHours, addDays } from 'date-fns';

const DOWNLOAD_ATTEMPTS = 3; // Number of attempts to download sensor data
const DOWNLOAD_TIMEOUT = 2000; // Timeout between attempts in milliseconds (2 seconds)

export const useMeasuresStore = defineStore('measures', () => {
  const datasets = ref<Datasets>();
  const loading = ref(false);
  const sensors = ref<SensorData[]>([]);
  const sensorsSampled = ref<SensorData[]>([]);
  const startDate = ref<Date>();
  const endDate = ref<Date>();
  const sensorsRaw = ref<SensorData[]>([]);

  const timeseriesStore = useTimeseriesChartsStore();

  watch(() => timeseriesStore.timeRange, async () => {
    const startDateRange = timeseriesStore.timeRange[0];
    startDateRange.setMinutes(0, 0, 0);
    const endDateRange = timeseriesStore.timeRange[1];
    endDateRange.setMinutes(0, 0, 0);
    // Add one hour to round up to the nearest next hour
    endDateRange.setHours(endDateRange.getHours() + 1);
    // Calculate the time range in hours
    const timeRangeHours = (endDateRange.getTime() - startDateRange.getTime()) / (1000 * 60 * 60);
    if (timeRangeHours < 7 * 24) {
      // check if the time range is included in the current time range
      if (startDate.value && endDate.value && startDateRange.getTime() >= startDate.value.getTime() && endDateRange.getTime() <= endDate.value.getTime()) {
        //console.debug('Time range is included in the current time range');
        return;
      }
      startDate.value = roundToNearestHours(startDateRange);
      endDate.value = addDays(startDate.value, 7);
      if (loading.value) return;
      await loadDatasetsRaw();
    } else {
      startDate.value = undefined;
      endDate.value = undefined;
      sensors.value = sensorsSampled.value;
    }
  });

  async function loadDatasets() {
    if (datasets.value) return Promise.resolve();

    loading.value = true;
    sensors.value = [];
    sensorsSampled.value = [];
    const response = await api.get('measures/datasets');
    datasets.value = response.data;

    let loaded = 0;
    const promises: Promise<void>[] = [];
    datasets.value?.sensors.forEach((sensor) => {
      promises.push(downloadDataset(sensor.name, {})
      .then((response) => {
        if (!response?.data) {
          console.warn(`No data found for sensor: ${sensor.name}`);
          return;
        }
        sensorsSampled.value.push(response.data);
      }).finally(() => {
        loaded++;
        if (loaded === datasets.value?.sensors.length) {
          loading.value = false;
          sensors.value = sensorsSampled.value;
        }
      }));
    });
    return Promise.all(promises);
  }

  async function loadDatasetsRaw() {
    loading.value = true;
    sensorsRaw.value = [];

    let loaded = 0;
    const promises: Promise<void>[] = [];
    const params = {
      start: startDate.value?.toISOString(),
      end: endDate.value?.toISOString(),
    };
    datasets.value?.sensors.forEach((sensor) => {
      promises.push(downloadDataset(sensor.name, params)
      .then((response) => {
        if (!response?.data) {
          console.warn(`No data found for sensor: ${sensor.name}`);
          return;
        }
        const data = response.data as SensorData;
        sensorsRaw.value.push(data);
      }).finally(() => {
        loaded++;
        if (loaded === datasets.value?.sensors.length) {
          loading.value = false;
          sensors.value = sensorsRaw.value;
        }
      }));
    });
    return Promise.all(promises);
  }

  /**
   * Downloads a dataset by name with retry logic.
   * Retries the download if it fails, up to a specified number of attempts.
   * @param {string} name - The name of the dataset to download.
   * @param {Object} params - The parameters for the dataset download.
   * @returns {Promise<any>} - A promise that resolves with the downloaded dataset.
   */
  async function downloadDataset(name: string, params: Record<string, unknown>) {
    let attempts = 0;
    while (attempts < DOWNLOAD_ATTEMPTS) {
      try {
        return await api.get(`measures/dataset/${name}`, { params });
      } catch (error) {
        attempts++;
        if (attempts >= DOWNLOAD_ATTEMPTS) {
          console.error(`Failed to load dataset after ${DOWNLOAD_ATTEMPTS} attempts: ${name}`, error);
          throw error;
        }
        console.warn(`Attempt ${attempts} failed for ${name}, retrying in ${DOWNLOAD_TIMEOUT}ms...`);
        await new Promise(resolve => setTimeout(resolve, DOWNLOAD_TIMEOUT));
      }
    }
  }

  /**
   * Downloads raw sensor data for a specific sensor within a given time range.
   * Retries the download if it fails, up to a specified number of attempts.
   *
   * @param {string} name - The name of the sensor to download data for.
   * @param {Date | undefined} start - The start date for the data range.
   * @param {Date | undefined} end - The end date for the data range.
   * @param {string[] | undefined} measures - Optional array of measures to filter by.
   * @returns {Promise<any>} - A promise that resolves with the downloaded data.
   */
  async function downloadSensorRawData(name: string, start: Date | undefined, end: Date | undefined, measures: string[] | undefined) {
    const params = {
      start: start ? start.toISOString() : startDate.value?.toISOString(),
      end: end ? end.toISOString() : endDate.value?.toISOString(),
      resample: false,
      filter: false,
      measures: measures?.join(','),
    };
    return downloadDataset(name, params);
  }

  return {
    loading,
    datasets,
    sensors,
    loadDatasets,
    downloadSensorRawData,
  };
});
