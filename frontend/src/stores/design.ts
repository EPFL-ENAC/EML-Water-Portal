import { api } from 'src/boot/api';
import { defineStore } from 'pinia';
import type { DesignData } from 'src/models';

export const useDesignStore = defineStore('design', () => {
  const designData = ref<Record<string, DesignData>>({});
  const loading = ref<boolean>(false);

  async function getWatersheds() {
    try {
      const response = await api.get<string[]>('/design/watersheds');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch watersheds:', error);
      return [];
    }
  }

  async function fetchDesignData() {
    if (loading.value) return;

    loading.value = true;
    try {
      const watersheds = await getWatersheds();
      const promises = watersheds.map(async (watershed) => {
        try {
          const response = await api.get<DesignData>(`/design/${watershed}`);
          designData.value[watershed] = response.data;
        } catch (error) {
          console.error(`Failed to fetch design data for watershed ${watershed}:`, error);
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to fetch watersheds:', error);
    } finally {
      loading.value = false;
    }
  }

  return {
    designData,
    loading,
    fetchDesignData,
  };
})
