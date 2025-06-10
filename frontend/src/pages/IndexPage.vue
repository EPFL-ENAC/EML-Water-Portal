<template>
  <q-page id="q-page-content" style="display: flex;">
    <div id="tooltip-container" class="flex"></div>

    <div class="row" style="flex: 1;">
      <div class="col-12 col-md-3 bg-grey-2">
        <q-card bordered class="q-ma-sm q-mb-md">
          <div style="height: 250px">
            <maplibre-map
              position
              :center="[6.57, 46.5225]"
              :zoom="15"
              @map:loaded="onMapLoaded"
            />
          </div>
          <div>
            <q-btn-group flat spread class="q-ma-none">
              <template v-for="sensor in SensorSpecs" :key="sensor.color">
                <q-btn-dropdown
                  v-if="sensor.label !== 'D'"
                  :title="sensor.label"
                  size="14px"
                  no-caps
                  stretch
                  class="text-grey-3"
                  :style="`background-color: ${sensor.color};`"
                >
                  <template v-slot:label>
                    <div class="text-wrap text-left" style="white-space: normal; max-width: 150px;">
                      {{ getLabel(locale, sensor.title) }}
                    </div>
                  </template>
                  <q-list>
                    <q-item dense class="q-pa-none">
                      <q-item-section class="q-pa-none">
                        <q-btn-group flat spread>
                          <q-btn flat size="sm" :label="$t('all')" @click="onApplySensors(sensor.label)" />
                          <q-btn flat size="sm" :label="$t('clear')" @click="onRemoveSensors(sensor.label)" />
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
            </q-btn-group>
          </div>
        </q-card>
        <q-list>
          <q-item-label header class="text-h5">{{
            $t('parameters')
          }}</q-item-label>
          <template v-for="category in ['parameters_measured', 'parameters_scenario']" :key="category">
            <q-item-label header class="text-h6">{{
              $t(category)
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
                      :label="measure.label"
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
          <q-item-label header class="text-h5 q-pb-none">
            <span>{{ $t('scenarios') }}</span>
          </q-item-label>
          <q-item>
            <div v-if="scenariiStore.scenarii.length === 0" class="text-help">
              {{ $t('scenario_info') }}
            </div>
            <div v-else>
              <q-chip
                v-for="scenario in scenariiStore.scenarii"
                :key="`${scenario.watershed}:${scenario.name}`"
                removable
                @remove="onRemoveScenario(scenario)"
                size="sm"
              >
                <q-icon
                  name="circle"
                  :style="{ color: scenario.lineColor, position: 'relative', left: '-0.3rem' }"
                  size="0.9rem"
                />
                {{ `${scenario.watershed}: ${scenario.name}` }}
              </q-chip>
            </div>
          </q-item>

        </q-list>
      </div>
      <div class="col-12 col-md-9">
        <div class="bg-white" style="position: sticky; top: 53px; z-index: 1000;">
          <q-toolbar>
            <div class="full-width q-mt-sm q-mb-xl">
              <time-range-slider player class="q-ml-md q-mr-md" />
            </div>
            <q-space />
            <q-btn
              :title="$t('charts_height')"
              :disable="measuresStore.loading"
              icon="height"
              size="xs"
              class="q-mr-sm"
            >
              <q-menu class="q-pa-sm">
                <div class="text-caption q-mb-sm">{{ $t('charts_height') }}</div>
                <q-slider
                  v-model="chartHeight"
                  :disable="measuresStore.loading"
                  :min="100"
                  :max="500"
                  :step="50"
                  :label-value="chartHeight + ' px'"
                  switch-label-side
                  debounce="300"
                  class="q-pl-sm q-pr-sm"
                />
              </q-menu>
            </q-btn>
            <q-btn-toggle
              v-model="colsSpan"
              :disable="measuresStore.loading"
              toggle-color="primary"
              :options="[
                {value: '12', slot: 'one'},
                {value: '6', slot: 'two'},
              ]"
              size="xs"
            >
              <template v-slot:one>
                <div class="row items-center no-wrap">
                  <q-icon name="splitscreen" />
                </div>
              </template>

              <template v-slot:two>
                <div class="row items-center no-wrap">
                  <q-icon name="grid_view" />
                </div>
              </template>
            </q-btn-toggle>
          </q-toolbar>
          <q-separator />
        </div>
        <template v-for="category in ['parameters_measured', 'parameters_scenario']" :key="category">
          <q-item-label header class="text-h6">{{
            $t(category)
          }}</q-item-label>
          <div v-if="measuresFiltered(category).some((measure) => measuresVisible[measure.key])" class="row">
            <template
              v-for="measure in measuresFiltered(category)"
              :key="measure.key"
            >
              <div v-show="measuresVisible[measure.key]" :class="colsClass">
                <q-card square bordered flat>
                  <q-card-section>
                    <timeseries-chart
                      :measure="measure.key"
                      :label="measure.axis_label || measure.label"
                      :unit="measure.unit"
                      :precision="measure.precision"
                      :height="chartHeight"
                      stacked
                    />
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </div>
          <div v-else class="text-help q-ml-md">
            {{ $t('no_measure_selected') }}
          </div>
        </template>
      </div>
    </div>

    <scenarii-dialog v-model="showScenario" />
    <sensor-dialog v-model="showSensor" />

    <q-dialog v-if="measureSelected" v-model="showMeasure" maximized>
      <q-card>
        <q-bar class="bg-white q-ma-md">
          <div class="text-h5">
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
import ScenariiDialog from 'src/components/ScenariiDialog.vue';
import SensorDialog from 'src/components/SensorDialog.vue';
import { Settings } from 'src/stores/settings';
import {
  MeasureOptions,
  SensorSpecs,
} from 'src/utils/options';
import { Scenario } from 'src/stores/scenarii';
import { getLabel } from 'src/utils/misc';

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();

const showScenario = ref(false);
const showSensor = ref(false);
const showMeasure = ref(false);
const measureSelected = ref<string>();
const colsSpan = ref('6');
const colsClass = computed(() => `col-12 col-md-${colsSpan.value}`);
const chartHeight = ref(200);

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
  () => mapStore.sensorSelected,
  () => {
    if (mapStore.sensorSelected) {
      showSensor.value = true;
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

const measuresFiltered = (category: string) => {
  return MeasureOptions.filter((m) => m.is_scenario_measure === (category === 'parameters_scenario'));
};

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

function onRemoveScenario(scenario: Scenario) {
  scenariiStore.removeScenario(scenario);
}

</script>
