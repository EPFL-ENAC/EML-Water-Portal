<template>
  <q-page id="q-page-content">
    <q-splitter
      v-model="splitterModel"
      horizontal
      style="height: 100%; width: 100%; position: absolute; z-index: 10"
    >
      <template v-slot:before>
        <div class="row items-center full-height justify-evenly">
          <maplibre-map
            position
            :center="[6.573, 46.5218]"
            :zoom="14"
            @map:loaded="onMapLoaded"
          />
        </div>
      </template>
      <template v-slot:separator>
        <q-btn
          color="accent"
          text-color="white"
          size="4px"
          icon="drag_indicator"
          style="cursor: grab"
        />
      </template>
      <template v-slot:after>
        <div v-if="!measuresStore.loading" class="row">
          <div class="col">
            <div v-if="!measuresStore.loading" style="position: fixed;">
              <div v-for="measure in measureOptions" :key="measure.key">
                <q-checkbox
                  v-model="measuresVisible[measure.key]"
                  :label="measure.label"
                />
              </div>
            </div>
          </div>
          <div class="col-10">
            <div
              class="flex column justify-between"
              style="overflow-x: hidden; overflow-y: hidden"
            >
              <div v-for="measure in measureOptions" :key="measure.key">
                <timeseries-chart
                  v-if="measuresVisible[measure.key]"
                  :measure="measure.key"
                  :label="measure.label"
                  :height="200"
                  :debounce-time="measure.key == 'water_temperature' ? 80 : 30"
                  class="q-pa-sm"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="100px" />
        </div>
      </template>
    </q-splitter>

    <scenarii-dialog v-model="showScenario" />
  </q-page>
</template>

<script setup lang="ts">
import MaplibreMap from 'src/components/MaplibreMap.vue';
import { Map } from 'maplibre-gl';
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';
import ScenariiDialog from 'src/components/ScenariiDialog.vue';
import { Settings } from 'src/stores/settings';

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();

const splitterModel = ref(30);
const showScenario = ref(false);

const measureOptions = computed(() => {
  return [
    { key: 'water_level', label: 'Water level' },
    { key: 'water_temperature', label: 'Water Temperature' },
    { key: 'electro_conductivity', label: 'Electrical conductivity' },
    { key: 'dissolved_oxygen', label: 'Dissolved oxygen' },
    { key: 'ph', label: 'pH' },
    { key: 'turbidity', label: 'Turbidity' },
    {
      key: 'oxidation_reduction_potential',
      label: 'Oxidation-reduction potential',
    },
    { key: 'air_temperature', label: 'Air Temperature' },
  ];
});

const measuresVisible = ref<Record<string, boolean>>(settingsStore.settings?.measuresVisible || {});

onMounted(() => measuresStore.loadDatasets());

watch(
  () => mapStore.bvSelected,
  () => {
    if (mapStore.bvSelected) {
      showScenario.value = true;
    }
  },
);

watch(
  [() => scenariiStore.scenarii, () => filtersStore.sensors],
  () => {
    mapStore.applyState();
  },
  { deep: true },
);

watch(
  () => measuresVisible.value,
  onMeasureVisibilityChange,
  { deep: true },
);

function onMapLoaded(map: Map) {
  mapStore.initLayers(map).then(() => {
    mapStore.applyState();
  });
}

function onMeasureVisibilityChange() {
  settingsStore.saveSettings({
    measuresVisible: measuresVisible.value,
  } as Settings);
}

</script>
