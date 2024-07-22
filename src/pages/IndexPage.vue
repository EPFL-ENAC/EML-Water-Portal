<template>
  <q-page >
    <div class="row">
    <maplibre-map
      position
      :zoom="15"
      :height="'95vh'"
      @map:loaded="onMapLoaded"
      @map:click="onMapClick"  />
      
    </div>
    <div>
      Time series line charts here
    </div>
  </q-page>
</template>

<script setup lang="ts">
import MaplibreMap from 'components/MaplibreMap.vue';
import { Map, MapMouseEvent } from 'maplibre-gl';

const mapStore = useMapStore();
const filtersStore = useFiltersStore();

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
