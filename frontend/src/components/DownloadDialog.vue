<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.md ? '' : 'width: 600px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          {{ t('download_data') }}
        </div>
        <div class="q-mb-md text-help">
          {{ t('download.content') }}
        </div>
        <q-option-group
          v-model="group"
          :options="groupOptions"
          :disable="downloading"
        />
      </q-card-section>
      <q-card-actions v-if="$q.screen.gt.xs" align="right">
        <span class="text-help q-ml-md">{{ message }}</span>
        <q-space />
        <q-spinner-dots v-if="downloading" size="20px" color="primary" class="on-left"/>
        <q-btn flat :label="t('cancel')" color="grey-6" v-close-popup />
        <q-btn
          flat
          :label="t('download.label')"
          color="primary"
          :disable="downloading"
          @click="onDownload"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { SensorData, Vector } from 'src/models';
import {
  MeasureOptions,
  SensorSpecs,
} from 'src/utils/options';
import Papa from 'papaparse';
import JSZip from "jszip";

interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'download']);

const $q = useQuasar();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const timeseriesStore = useTimeseriesChartsStore();

const showDialog = ref(props.modelValue);
const group = ref('measures');
const downloading = ref(false);
const message = ref('');

const groupOptions = computed(() => [
  { label: t('download.group.measures'), value: 'measures' },
  { label: t('download.group.sensors'), value: 'sensors' },
]);
const measuresVisible = computed(() => Object.entries(settingsStore.settings?.measuresVisible || {})
  .map((m) => m[1] ? m[0] : undefined)
  .filter((m) => MeasureOptions.find((opt) => opt.key === m)?.is_scenario_measure === false) || []);

watch(
  () => props.modelValue,
  (value) => {
    showDialog.value = value;
    downloading.value = false;
    message.value = '';
  },
);

function onHide() {
  downloading.value = false;
  message.value = '';
  emit('update:modelValue', false);
}

function onDownload() {
  downloading.value = true;
  // Logic to handle data download
  const [start, end] = timeseriesStore.timeRange;
  const promises = [];
  const sensorErrors: string[] = [];
  message.value = t('download.downloading');
  for (const sensor of SensorSpecs) {
    const locations = sensor.locations.filter((location) => filtersStore.sensors.length === 0 || filtersStore.sensors.includes(location));
    const measures = sensor.measures.filter((m) => measuresVisible.value.includes(m));
    if (locations.length && measures.length) {
      for (const location of locations) {
        promises.push(measuresStore.downloadSensorRawData(location, start, end, measures)
          .then((response) => {
            // Handle successful download
            return response?.data || [];
          })
          .catch((error) => {
            // Handle error in download
            console.error(`Error downloading data for ${location}:`, error);
            message.value = t('download.error', { sensor: location });
            sensorErrors.push(location);
            return [];
          }));
      }
    }
  }
  Promise.all(promises)
    .then((data) => {
      // Handle all downloaded data
      // Process by group
      if (group.value === 'measures') {
        const zip = new JSZip();
        for (const [measure, rows] of groupByMeasures(data).entries()) {
          const csv = Papa.unparse(rows, { quotes: false });
          zip.file(`${measure}.csv`, csv);
        }
        return zip.generateAsync({ type: 'blob' });
      } else {
        const groupedData = groupBySensors(data);
        const zip = new JSZip();
        for (const key of groupedData.keys()) {
          const csv = Papa.unparse(groupedData.get(key) || [], { quotes: false });
          zip.file(`${key}.csv`, csv);
        }
        return zip.generateAsync({ type: 'blob' });
      }
    })
    .then((content) => {
      if (!downloading.value) return;
      const now = new Date();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.setAttribute('download', `water-portal-data-${now.toISOString()}.zip`);
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch((error) => {
      console.error('Error processing data:', error);
    })
    .finally(() => {
      downloading.value = false;
      emit('update:modelValue', false);
      emit('download');
      if (sensorErrors.length > 0) {
        $q.notify({
          type: 'negative',
          message: t('download.partial_error', { sensors: sensorErrors.join(', ') }),
        });
      }
    });
}

function groupByMeasures(data: SensorData[]) {
  // Group data by measures
  const groupedData = new Map<string, { [key: string]: string | number | null }[]>();
  const measureSensors = new Map<string, string[]>();
  data?.forEach((d: SensorData) => {
    d?.vectors?.forEach((v: Vector) => {
      if (v.measure === 'timestamp') return; // Skip timestamp, not a measure
      const ms = measureSensors.get(v.measure);
      if (!ms) {
        measureSensors.set(v.measure, [d.name]);
      } else {
        ms.push(d.name);
        measureSensors.set(v.measure, ms);
      }
    });
  });
  measureSensors.forEach((sensors, measure) => {
    if (!sensors || sensors.length === 0) return;
    groupedData.set(measure, []);
    const rowObjs = new Map<string, { [key: string]: string | number | null }>();
    data?.forEach((d: SensorData) => {
      if (!sensors.includes(d.name)) return;
      const timestamps = d?.vectors?.find((v: Vector) => v.measure === 'timestamp');
      timestamps?.values.forEach((timestamp: string | null | number, index: number) => {
        if (timestamp === null || timestamp === undefined) return;
        d?.vectors?.forEach((vector) => {
          if (vector.measure === measure) {
            if (!rowObjs.has(timestamp as string)) {
              rowObjs.set(timestamp as string, { timestamp });
            }
            const value = vector.values[index];
            const rowObj = rowObjs.get(timestamp as string);
            if (!rowObj) return;
            rowObj[d.name] = value !== undefined ? value : '';
            rowObjs.set(timestamp as string, rowObj);
          }
        });
      });
    });
    rowObjs.forEach((row) => {
      groupedData.get(measure)?.push(row);
    });
  });
  return groupedData;
}

function groupBySensors(data: SensorData[]) {
  // Group data by sensors
  const groupedData = new Map<string, (string | number)[][]>();
  data?.forEach((d: SensorData) => {
    const timestamps = d?.vectors?.find((v: Vector) => v.measure === 'timestamp');
    const csv: (string | number)[][] = [d?.vectors?.map((v: Vector) => v.measure)];
    timestamps?.values?.forEach((timestamp: string | null | number, index: number) => {
      csv.push(d?.vectors?.map((v: Vector) => v.values[index] === undefined || v.values[index] === null ? '' : v.values[index]) || []);
    });
    groupedData.set(d.name, csv);
  });
  return groupedData;
}
</script>
