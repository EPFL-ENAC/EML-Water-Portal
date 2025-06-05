import { defineStore } from 'pinia';
import Papa from 'papaparse'
import { type SensorInfo } from 'src/models';

interface SensorInfoCSV {
  sensor: string
  site_name: string
  model: string
  site_description_en: string 
  site_description_fr: string
}

export const useHelpStore = defineStore('help', () => {
  const show = ref(false);
  const content = ref('');
  const current = ref('');
  const sensorsInfo = ref<SensorInfo[]>([]);

  async function toggleHelp(name: string) {
    if (current.value === name) {
      show.value = !show.value;
    } else {
      current.value = name;
      const response = await fetch(`${name}.md`);
      content.value = await response.text();
      show.value = true;
    }
  }

  async function loadSensorsInfo() {
    try {
      const response = await fetch('sensors_info.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch sensors_info.csv: ${response.statusText}`);
      }
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          sensorsInfo.value = (results.data as SensorInfoCSV[]).map(row => {
            return {
              sensor: row.sensor,
              site_name: row.site_name,
              model: row.model,
              site_description: {
                en: row.site_description_en || '',
                fr: row.site_description_fr || ''
              }
            };
          });
        },
        error: function(error) {
          console.error('Error parsing CSV:', error);
          sensorsInfo.value = []; // Fallback to an empty array
        }
      });
    } catch (error) {
      console.error('Error loading sensors info:', error);
      sensorsInfo.value = []; // Fallback to an empty array
    }
  }

  async function getSensorInfo(sensor: string) {
    if (sensorsInfo.value.length === 0) {
      await loadSensorsInfo();
    }
    return sensorsInfo.value.find(info => info.sensor === sensor);
  }

  return {
    show,
    content,
    toggleHelp,
    getSensorInfo
  };
});
