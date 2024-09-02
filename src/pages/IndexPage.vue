<template>
  <q-page id="q-page-content">
    <div id="tooltip-container" class="flex"></div>

    <div class="row">
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
        <q-list v-if="!measuresStore.loading">
          <q-item-label header class="text-h6">{{
            $t('measures')
          }}</q-item-label>
          <q-list separator dense>
            <q-item
              v-ripple
              v-for="measure in MeasureOptions"
              :key="measure.key"
            >
              <q-item-section>
                <div class="row">
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
                      class="on-right"
                      style="margin-top: 14px"
                    />
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
              </q-item-section>
              <q-item-section side>
                <div class="color-boxes q-ml-sm" style="width: 100px">
                  <template
                    v-for="color in getColorGradient(measure.key, 20).reverse()"
                    :key="color"
                  >
                    <span
                      v-if="measure.key !== 'water_samples'"
                      class="color-box"
                      :style="`background-color: ${color}`"
                    ></span>
                  </template>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <q-item-label header class="text-h6">{{
            $t('time_range')
          }}</q-item-label>
          <q-item>
            <div class="full-width q-mb-xl">
              <time-range-slider player class="q-ml-md q-mr-md" />
            </div>
          </q-item>
        </q-list>
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
              stacked
              class="q-pa-sm"
            />
          </div>
          <div class="bg-white" style="position: sticky; bottom: 0px;">
            <time-axis class="q-pl-sm q-pr-sm" />
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
import TimeRangeSlider from 'src/components/charts/TimeRangeSlider.vue';
import TimeAxis from 'src/components/charts/TimeAxis.vue';
import ScenariiDialog from 'src/components/ScenariiDialog.vue';
import { Settings } from 'src/stores/settings';
import {
  MeasureOptions,
  SensorColors,
  getColorGradient,
} from 'src/utils/options';

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
