<template>
  <div>
    <q-card bordered class="q-ma-sm q-mb-md">
      <div style="height: 250px">
        <q-btn
          v-show="mapStore.map"
          dense
          @click="onToggleFullscreen"
          size="13px"
          :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
          class="fullscreen-toggle"
        />
        <maplibre-map
          position
          :center="[6.57, 46.5225]"
          :zoom="15"
          @map:loaded="onMapLoaded"
        />
      </div>
      <div class="row">
        <template v-for="sensor in SensorSpecs" :key="sensor.color">
          <q-btn-dropdown
            v-if="sensor.label !== 'D'"
            :title="sensor.label"
            no-caps
            stretch
            unelevated
            class="text-grey-3 col-12 col-sm-6 col-md-12 col-lg-6"
            :style="`background-color: ${sensor.color};`"
          >
            <template v-slot:label>
              <div class="text-wrap text-left" style="white-space: normal;">
                {{ getLabel(locale, sensor.title) }}
              </div>
            </template>
            <q-list>
              <q-item dense class="q-pa-none">
                <q-item-section class="q-pa-none">
                  <q-btn-group flat spread>
                    <q-btn flat size="sm" :label="t('all')" @click="onApplySensors(sensor.label)" />
                    <q-btn flat size="sm" :label="t('clear')" @click="onRemoveSensors(sensor.label)" />
                  </q-btn-group>
                </q-item-section>
              </q-item>
              <q-separator />
              <template v-for="(location, idx) in sensor.locations" :key="location">
                <q-item dense clickable @click="onToggleSensorLocation(location)">
                  <q-item-section avatar>
                    <q-icon color="secondary" :name="filtersStore.sensors.includes(location) ? 'check_box' : 'check_box_outline_blank'" />
                  </q-item-section>
                  <q-item-section no-wrap>
                    <span>{{ location }}</span>
                  </q-item-section>
                  <q-item-section side>
                    <q-icon name="circle" size="xs" :style="`color: ${sensor.colors[idx]}`" />
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-btn-dropdown>
        </template>
      </div>
    </q-card>
    <div class="q-ml-md"><q-icon name="lightbulb" size="xs"/> <span class="text-help">{{ t('map_help') }}</span></div>
    <q-list>
      <template v-for="category in ['parameters_measured', 'parameters_scenario']" :key="category">
        <q-item-label header class="text-h6">{{
          t(category)
        }}</q-item-label>
        <q-list separator dense>
          <q-item
            v-ripple
            v-for="measure in measuresFiltered(category)"
            :key="measure.key"
          >
            <q-item-section>
              <div class="row">
                <q-checkbox
                  v-model="measuresVisible[measure.key]"
                  :disable="measuresStore.loading"
                  :label="t(`measure.${measure.key}.label`)"
                />
                <template
                  v-for="spec in getSensorSpec(measure.key)"
                  :key="spec.label"
                >
                  <q-icon
                    name="circle"
                    :style="`color: ${spec.color};`"
                    :title="`${spec.label}: ${getLabel(locale, spec.title)}`"
                    class="on-right"
                    style="margin-top: 14px"
                  />
                </template>
                <q-btn
                  v-if="measuresVisible[measure.key]"
                  :disable="measuresStore.loading"
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
          </q-item>
        </q-list>
      </template>

    </q-list>

    <scenarii-dialog v-model="showScenario" />
    <sensor-dialog v-model="showSensor" />

    <q-dialog v-if="measureSelected" v-model="showMeasure" maximized>
      <q-card>
        <q-bar class="bg-white q-ma-md">
          <div class="text-h5">
            {{ t(`measure.${measureSelected.key}.label`) }}
          </div>
          <q-space />
          <q-btn dense flat icon="close" size="lg" v-close-popup> </q-btn>
        </q-bar>
        <q-card-section>
          <timeseries-chart
            :measure="measureSelected.key"
            :label="t(`measure.${measureSelected.key}.label`)"
            :unit="measureSelected.unit"
            :precision="measureSelected.precision"
            :height="80"
            :height-unit="'vh'"
            zoom
            :debounce-time="30"
            class="q-pa-sm"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { Map } from 'maplibre-gl';
import MaplibreMap from 'src/components/MaplibreMap.vue';
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';
import ScenariiDialog from 'src/components/ScenariiDialog.vue';
import SensorDialog from 'src/components/SensorDialog.vue';
import {
  type MeasureOption,
  MeasureOptions,
  SensorSpecs,
} from 'src/utils/options';
import { getLabel } from 'src/utils/misc';
const { locale } = useI18n();

const { t } = useI18n();
const $q = useQuasar();
const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const measuresStore = useMeasuresStore();
const filtersStore = useFiltersStore();

const showMeasure = ref(false);
const showScenario = ref(false);
const showSensor = ref(false);
const measureSelected = ref<MeasureOption>();
const measuresVisible = ref<Record<string, boolean>>(
  settingsStore.settings?.measuresVisible || {},
);

const measuresFiltered = (category: string) => {
  return MeasureOptions.filter((m) => m.is_scenario_measure === (category === 'parameters_scenario'));
};


watch(
  () => mapStore.bvSelected,
  () => {
    if (mapStore.bvSelected) {
      showScenario.value = true;
    }
  },
);

watch(
  () => mapStore.sensorSelected,
  () => {
    if (mapStore.sensorSelected) {
      showSensor.value = true;
    }
  },
);

function onMapLoaded(map: Map) {
  mapStore.initLayers(map).then(() => {
    mapStore.applyState();
  }).catch((err) => {
    console.error('Error initializing map layers:', err);
  });
}


function onShowMeasure(measure: string) {
  measureSelected.value = MeasureOptions.find((m) => m.key === measure);
  showMeasure.value = measureSelected.value !== undefined;
}

function getSensorSpec(measure: string) {
  return SensorSpecs.filter((opt) => opt.measures.includes(measure));
}

function onApplySensors(family: string) {
  filtersStore.applySensors(SensorSpecs.find((ss) => ss.label === family)?.locations);
}

function onRemoveSensors(family: string) {
  filtersStore.removeSensors(SensorSpecs.find((ss) => ss.label === family)?.locations);
}

function onToggleSensorLocation(location: string) {
  filtersStore.toggleSensor(location);
}

function onToggleFullscreen(e: Event) {
  if (!e.target) return;
  let target = (e.target as HTMLElement).parentNode as HTMLElement;
  if (!target) return;
  target = target.parentNode as HTMLElement;
  if (!target) return;
  target = target.parentNode as HTMLElement;
  $q.fullscreen.toggle(target).catch((err) => {
    console.error('Error toggling fullscreen:', err);
  });
}
</script>

<style scoped>
.fullscreen-toggle {
  position: absolute;
  top: 108px;
  right: 9px;
  z-index: 2000;
  background-color: white;
  border: solid 1px #e2e2e2;
  border-radius: 5px;
}
</style>
