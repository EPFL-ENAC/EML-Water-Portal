<template>
  <q-page id="q-page-content">
    <div id="tooltip-container" class="flex"></div>

    <div id="measures-container" class="row">
      <div class="col-12 col-md-3 bg-grey-2">
        <q-card bordered class="q-ma-sm q-mb-md">
          <div style="height: 40vh">
            <maplibre-map
              position
              :center="[6.57, 46.5225]"
              :zoom="15"
              @map:loaded="onMapLoaded"
            />
          </div>
          <div>
            <q-btn-group flat spread class="q-ma-none">
              <template v-for="sensor in SensorColors" :key="sensor.color">
                <q-btn
                  size="10px"
                  :label="sensor.label"
                  :title="sensor.title"
                  class="text-bold text-grey-3"
                  :style="`background-color: ${sensor.color}; opacity: ${
                    mapStore.layerSelections.find((l) => l.id === sensor.layer)
                      ?.visible
                      ? 1
                      : 0.3
                  };`"
                  @click="onToggleSensorLayer(sensor.layer)"
                />
              </template>
            </q-btn-group>
          </div>
        </q-card>
        <div v-if="!measuresStore.loading">
          <div v-for="measure in MeasureOptions" :key="measure.key">
            <q-checkbox
              v-model="measuresVisible[measure.key]"
              :label="measure.label"
            />
            <template v-for="col in getSensorColors(measure.key)" :key="col">
              <q-icon name="circle" :style="`color: ${col};`" class="q-ml-xs" />
            </template>
            <q-btn
              v-if="measuresVisible[measure.key]"
              icon="fullscreen"
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
      <div class="col-12 col-md-9">
        <div>
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

const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();

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

function onToggleSensorLayer(id: string) {
  mapStore.toggleLayerVisibility(id);
}
</script>
