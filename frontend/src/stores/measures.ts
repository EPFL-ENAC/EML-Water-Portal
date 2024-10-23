import { Datasets, SensorData } from 'src/models';
import { api } from 'src/boot/api';

export const useMeasuresStore = defineStore('measures', () => {
  const datasets = ref<Datasets>();
  const loading = ref(false);
  const sensors = ref<SensorData[]>([]);

  async function loadDatasets() {
    if (datasets.value) return Promise.resolve();

    loading.value = true;
    sensors.value = [];
    const response = await api.get('measures/datasets');
    datasets.value = response.data;

    let loaded = 0;
    const promises: Promise<void>[] = [];
    datasets.value?.sensors.forEach((sensor) => {
      promises.push(api.get(`measures/dataset/${sensor.name}`).then((response) => {
        sensors.value.push(response.data);
      }).finally(() => {
        loaded++;
        if (loaded === datasets.value?.sensors.length) {
          loading.value = false;
        }
      }));
    });
    return Promise.all(promises);
  }

  return {
    loading,
    datasets,
    sensors,
    loadDatasets,
  };
});
