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
        <q-btn color="accent" text-color="white" size="4px" icon="drag_indicator" />
      </template>
      <template v-slot:after>
        <div>
          <q-list>
            <template v-for="measure in measureOptions" :key="measure.key">
              <q-expansion-item
                switch-toggle-side
                expand-separator
                dense
                :label="measure.label"
                header-class="bg-grey-2 text-bold"
              >
                    <timeseries-chart :source="measure.key" :height="200" class="q-pa-sm" />
               
              </q-expansion-item>
            </template>
          </q-list>
        </div>
      </template>
    </q-splitter>
    
  </q-page>
</template>

<script setup lang="ts">
import MaplibreMap from 'components/MaplibreMap.vue';
import { Map, MapMouseEvent } from 'maplibre-gl';
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';

const mapStore = useMapStore();
const filtersStore = useFiltersStore();

const splitterModel = ref(30);

const measureOptions = computed(() => {
  return [
    { key: 'water_temperature', label: 'Water Temperature' },
    { key: 'air_temperature', label: 'Air Temperature' },
    { key: 'electro_conductivity', label: 'Specific electro-conductivity' },
    { key: 'turbidity', label: 'Turbidity' },
    { key: 'dissolved_oxygen', label: 'Dissolved oxygen' },
    { key: 'ph', label: 'pH' },
    { key: 'oxidation_reduction_potential', label: 'Oxidation-reduction potential' },
    { key: 'depth', label: 'Depth' },
    { key: 'water_level', label: 'Water level' },
  ]
})

function onMapLoaded(map: Map) {
  mapStore.initLayers(map).then(() => {
    mapStore.applyFilters(filtersStore.asParams());
  });
}

function onMapClick(event: MapMouseEvent) {
  console.log('Map clicked at:', event.lngLat);
  // custom popup
  // new Popup()
  //   .setLngLat(event.lngLat)
  //   .setHTML('<b>Hello World!</b>')
  //   .addTo(map as Map);
}
</script>
