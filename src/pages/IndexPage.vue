<template>
  <q-page id="q-page-content">
    <div id="tooltip-container" class="flex"></div>

    <q-splitter
      v-model="splitterModel"
      horizontal
      style="height: 100%; width: 100%; position: absolute; z-index: 10"
    >
      <template v-slot:before>
        <div class="row items-center full-height justify-evenly">
          <maplibre-map
            position
            :center="[6.57, 46.5225]"
            :zoom="16"
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
            <div v-if="!measuresStore.loading" style="position: fixed">
              <div v-for="measure in MeasureOptions" :key="measure.key">
                <q-checkbox
                  v-model="measuresVisible[measure.key]"
                  :label="measure.label"
                />
                <template
                  v-for="col in getSensorColors(measure.key)"
                  :key="col"
                >
                  <q-icon
                    name="circle"
                    :style="`color: ${col};`"
                    class="q-ml-xs"
                  />
                </template>
                <q-btn
                  v-if="measuresVisible[measure.key]"
                  icon="open_in_new"
                  color="secondary"
                  flat
                  dense
                  rounded
                  size="sm"
                  @click="onShowMeasure(measure.key)"
                  class="on-right"
                />
              </div>
            </div>
          </div>
          <div class="col-10">
            <div
              class="flex column justify-between"
              style="overflow-x: hidden; overflow-y: hidden"
            >
              <div v-for="measure in MeasureOptions" :key="measure.key">
                <timeseries-chart
                  v-if="measuresVisible[measure.key]"
                  :measure="measure.key"
                  :label="measure.label"
                  :unit="measure.unit"
                  :precision="measure.precision"
                  :height="180"
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

    <q-dialog v-if="measureSelected" v-model="showMeasure" maximized>
      <q-card>
        <q-bar class="bg-white q-ma-md">
          <div class="text-h6">
            {{ MeasureOptions.find((m) => m.key === measureSelected)?.label }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" size="lg" v-close-popup> </q-btn>
        </q-bar>
        <q-card-section>
          <timeseries-chart
            :measure="measureSelected"
            :label="
              MeasureOptions.find((m) => m.key === measureSelected)?.label || ''
            "
            :height="80"
            :height-unit="'vh'"
            :debounce-time="30"
            class="q-pa-sm"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import MaplibreMap from 'src/components/MaplibreMap.vue';
import { Map } from 'maplibre-gl';
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';
import ScenariiDialog from 'src/components/ScenariiDialog.vue';
import { Settings } from 'src/stores/settings';
import { MeasureOptions, SensorColors } from 'src/utils/options';
import { connect } from 'echarts';

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();

const splitterModel = ref(30);
const showScenario = ref(false);
const showMeasure = ref(false);
const measureSelected = ref<string>();

const measuresVisible = ref<Record<string, boolean>>(
  settingsStore.settings?.measuresVisible || {},
);

onMounted(() => {
  measuresStore.loadDatasets();
});

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

watch(() => measuresVisible.value, onMeasureVisibilityChange, { deep: true });

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

function onShowMeasure(measure: string) {
  measureSelected.value = measure;
  showMeasure.value = true;
}

function getSensorColors(measure: string) {
  return SensorColors.filter((opt) => opt.measures.includes(measure)).map(
    (opt) => opt.color,
  );
}
</script>
