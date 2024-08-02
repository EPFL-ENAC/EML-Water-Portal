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
            @map:click="onMapClick"
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
        <div
          class="flex column justify-between"
          style="overflow-x: hidden; overflow-y: hidden"
        >
          <q-list v-if="!measuresStore.loading">
            <template v-for="measure in measureOptions" :key="measure.key">
              <q-expansion-item
                switch-toggle-side
                expand-separator
                dense
                :label="measure.label"
                header-class="bg-grey-2 text-bold"
                @update:model-value="
                  (value) => updateExpansionState(measure.key, value)
                "
              >
                <timeseries-chart
                  :measure="measure.key"
                  :height="200"
                  :range-min="minDate"
                  :range-max="maxDate"
                  :range="timeRange"
                  :is-expanded="isExpanded[measure.key]"
                  :debounce-time="measure.key == 'water_temperature' ? 80 : 30"
                  class="q-pa-sm"
                />
              </q-expansion-item>
            </template>
          </q-list>
          <div v-else class="text-center q-pa-xl">
            <q-spinner-dots color="primary" size="100px" />
          </div>

          <custom-range-slider
            v-model="timeRange"
            :min="minDate"
            :max="maxDate"
          ></custom-range-slider>
        </div>
      </template>
    </q-splitter>

    <scenario-dialog v-model="showScenario" />
  </q-page>
</template>

<script setup lang="ts">
import MaplibreMap from 'src/components/MaplibreMap.vue';
import { Map, MapMouseEvent } from 'maplibre-gl';
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';

import ScenarioDialog from 'src/components/ScenarioDialog.vue';
import CustomRangeSlider from 'src/components/charts/CustomRangeSlider.vue';

const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();

const splitterModel = ref(30);
const showScenario = ref(false);

const minDate = new Date('2024-04-08T12:00:00.000Z');
const maxDate = new Date('2024-07-15T00:00:00.000Z');

const measureOptions = computed(() => {
  return [
    { key: 'water_temperature', label: 'Water Temperature' },
    { key: 'air_temperature', label: 'Air Temperature' },
    { key: 'electro_conductivity', label: 'Specific electro-conductivity' },
    { key: 'turbidity', label: 'Turbidity' },
    { key: 'dissolved_oxygen', label: 'Dissolved oxygen' },
    { key: 'ph', label: 'pH' },
    {
      key: 'oxidation_reduction_potential',
      label: 'Oxidation-reduction potential',
    },
    { key: 'water_level', label: 'Water level' },
  ];
});

const isExpanded = reactive<Record<string, boolean>>(
  measureOptions.value.reduce(
    (acc, m) => {
      acc[m.key] = false;
      return acc;
    },
    {} as Record<string, boolean>,
  ),
);
const updateExpansionState = (measureKey: string, expanded: boolean) => {
  isExpanded[measureKey] = expanded;
  console.log(isExpanded);
};

const timeRange = ref<[Date, Date]>([minDate, maxDate]);

onMounted(() => measuresStore.loadDatasets());

watch(
  () => mapStore.bvSelected,
  () => {
    if (mapStore.bvSelected) {
      showScenario.value = true;
      console.log(mapStore.bvSelected);
    }
  },
);

function onMapLoaded(map: Map) {
  mapStore.initLayers(map).then(() => {
    mapStore.applyFilters(filtersStore.asParams());
  });
}

function onMapClick(event: MapMouseEvent) {
  console.debug('Map clicked at:', event.lngLat);
  // custom popup
  // new Popup()
  //   .setLngLat(event.lngLat)
  //   .setHTML('<b>Hello World!</b>')
  //   .addTo(map as Map);
}
</script>
