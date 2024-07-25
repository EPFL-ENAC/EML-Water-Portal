<template>
  <q-page >

    <q-splitter
      v-model="splitterModel"
      horizontal
      style="height: 95vh"
    >
      <template v-slot:before>
        <div class="row items-center justify-evenly">
          <maplibre-map
            position
            :center="[6.573, 46.513]"
            :zoom="14"
            :height="'85vh'"
            @map:loaded="onMapLoaded"
            @map:click="onMapClick"  />
          
        </div>
      </template>
      <template v-slot:separator>
        <q-btn color="accent" text-color="white" size="4px" icon="drag_indicator" style="cursor: grab;" />
      </template>
      <template v-slot:after>
        <div>
          <q-list v-if="!measuresStore.loading">
            <template v-for="measure in measureOptions" :key="measure.key">
              <q-expansion-item
                switch-toggle-side
                expand-separator
                dense
                :label="measure.label"
                header-class="bg-grey-2 text-bold"
              >
                <timeseries-chart :measure="measure.key" :height="200" class="q-pa-sm" />
              </q-expansion-item>
            </template>
          </q-list>
          <div v-else class="text-center q-pa-xl">
            <q-spinner-dots color="primary" size="100px" />
          </div>
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

const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();

const splitterModel = ref(30);
const showScenario = ref(false);

const measureOptions = computed(() => {
  return [
    { key: 'water_temperature', label: 'Water Temperature' },
    { key: 'air_temperature', label: 'Air Temperature' },
    { key: 'electro_conductivity', label: 'Specific electro-conductivity' },
    { key: 'turbidity', label: 'Turbidity' },
    { key: 'dissolved_oxygen', label: 'Dissolved oxygen' },
    { key: 'ph', label: 'pH' },
    { key: 'oxidation_reduction_potential', label: 'Oxidation-reduction potential' },
    { key: 'water_level', label: 'Water level' },
  ]
})

onMounted(() => measuresStore.loadDatasets());

watch(() => mapStore.bvSelected, () => {
  if (mapStore.bvSelected) {
    showScenario.value = true;
    console.log(mapStore.bvSelected);
  }
});

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
