<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.md ? '' : 'width: 600px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          {{ t('download.modeled_data.title') }}
        </div>
        <div class="q-mb-md text-help">
          {{ t('download.modeled_data.content') }}
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
          :disable="downloading || scenarii.length === 0 || measuresVisible.length === 0"
          color="primary"
          @click="onDownload"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { ScenarioData, Vector } from 'src/models';
import {
  MeasureOptions,
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
const timeseriesStore = useTimeseriesChartsStore();
const scenariiStore = useScenariiStore();

const showDialog = ref(props.modelValue);
const group = ref('parameters');
const downloading = ref(false);
const message = ref('');

const groupOptions = computed(() => [
  { label: t('download.modeled_data.group.parameters'), value: 'parameters' },
  { label: t('download.modeled_data.group.sources'), value: 'sources' },
]);
const measuresVisible = computed(() => Object.entries(settingsStore.settings?.measuresVisible || {})
  .map((m) => m[1] ? m[0] : undefined)
  .filter((m) => MeasureOptions.find((opt) => opt.key === m)?.is_scenario_measure === true) || []);
const scenarii = computed(() => scenariiStore.scenarii.filter((s) => s.enabled && s.data));

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
  const sensorErrors: string[] = [];
  const data : ScenarioData[] = [];
  message.value = t('download.downloading');
  for (const scenario of scenarii.value) {
    const vectors = scenario.data?.vectors.filter((v) => measuresVisible.value.includes(v.measure) || v.measure === 'timestamp');
    if (vectors && vectors.length > 1) {
      // filter vectors per time range
      vectors.forEach((v) => {
        const filteredValues: (number | null)[] = [];
        const timestamps = scenario.data?.vectors.find((vec) => vec.measure === 'timestamp');
        if (!timestamps) return;
        timestamps.values.forEach((timestamp: string | number | null, index: number) => {
          if (timestamp === null || timestamp === undefined) return;
          const currentTimestamp = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
          if (currentTimestamp >= start.getTime() && currentTimestamp <= end.getTime()) {
            filteredValues.push(v.values[index] === undefined ? null : v.values[index] as number);
          }
        });
        v.values = filteredValues;
      });
      data.push({
        name: scenario.data?.name || scenario.name || 'unknown',
        vectors,
      });
    }
  }
  // Handle all downloaded data
  // Process by group
  let content = null;
  if (group.value === 'parameters') {
    const zip = new JSZip();
    for (const [measure, rows] of groupByMeasures(data).entries()) {
      const columns = new Set<string>();
      columns.add('timestamp');
      rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
          columns.add(key);
        });
      });
      // sort rows per timestamp alphabetically
      rows.sort((a, b) => {
        const aTimestamp = a.timestamp as string;
        const bTimestamp = b.timestamp as string;
        return aTimestamp.localeCompare(bTimestamp);
      });
      const csv = Papa.unparse(rows, { delimiter: ';', quotes: false, header: true, columns: Array.from(columns) });
      zip.file(`${measure}.csv`, csv);
    }
    content = zip.generateAsync({ type: 'blob' });
  } else {
    const groupedData = groupByScenarios(data);
    const zip = new JSZip();
    for (const key of groupedData.keys()) {
      const csv = Papa.unparse(groupedData.get(key) || [], { delimiter: ';', quotes: false });
      zip.file(`${key}.csv`, csv);
    }
    content = zip.generateAsync({ type: 'blob' });
  }
  if (content === null) return;
  content.then((content) => {
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

function groupByMeasures(data: ScenarioData[]) {
  // Group data by measures
  const groupedData = new Map<string, { [key: string]: string | number | null }[]>();
  const measureSensors = new Map<string, string[]>();
  data?.forEach((d: ScenarioData) => {
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
    data?.forEach((d: ScenarioData) => {
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

function groupByScenarios(data: ScenarioData[]) {
  // Group data by scenarios
  const groupedData = new Map<string, (string | number)[][]>();
  data?.forEach((d: ScenarioData) => {
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
