import { defineStore } from 'pinia';

export const useFiltersStore = defineStore(
  'filters',
  () => {
    const sensors = ref<string[]>([]);

    function reset() {
      sensors.value = [];
    }

    function toggleSensor(id: string) {
      if (sensors.value.includes(id)) {
        sensors.value = sensors.value.filter((val) => val !== id);
      } else {
        sensors.value.push(id);
        sensors.value.sort();
      }
    }

    return {
      sensors,
      reset,
      toggleSensor,
    };
  },
  { persist: true },
);
