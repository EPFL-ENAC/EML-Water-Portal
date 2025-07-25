<template>
  <div
    v-if="loading"
    class="inset-0 flex items-center full-height justify-center"
    style="z-index: 1"
  >
    <q-spinner-dots color="primary" size="50px" />
  </div>
  <div
    v-show="!loading"
    id="maplibre-map"
    style="height: 100%; width: 100%; z-index: 100"
  ></div>
</template>

<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AttributionControl,
  Map,
  type MapMouseEvent,
  NavigationControl,
  ScaleControl,
  type StyleSpecification,
} from 'maplibre-gl';
import { DivControl } from 'src/utils/control';

interface Props {
  styleSpec?: string | StyleSpecification | undefined;
  center: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  position?: boolean | string | undefined;
  attribution?: string;
}
const props = withDefaults(defineProps<Props>(), {
  styleSpec: 'style.json',
  zoom: 12,
  attribution: '',
  minZoom: 0,
  maxZoom: 0,
  position: false,
});

const emit = defineEmits(['map:loaded', 'map:click']);

const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>, <a href="https://www.swisstopo.admin.ch/" target="_blank">Swisstopo</a>, <a href="https://www.epfl.ch/" target="_blank">EPFL</a>';
// to be adapted to the style.json

const loading = ref(true);

let map: Map | undefined = undefined;

onMounted(() => {
  map = new Map({
    container: 'maplibre-map',
    style: props.styleSpec || 'style.json',
    center: props.center,
    zoom: props.zoom,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    attributionControl: false,
  });

  map.addControl(new NavigationControl());
  map.addControl(new ScaleControl());

  map.addControl(
    new AttributionControl({
      compact: true,
      customAttribution: props.attribution || DEFAULT_ATTRIBUTION,
    }),
  );

  map.on('click', (event: MapMouseEvent) => {
    emit('map:click', event, map as Map);
  });

  if (props.position === true || props.position === 'true') {
    const positionControl = new DivControl({ id: 'map-position' });
    map.addControl(positionControl, 'bottom-left');
    map.on('mousemove', function (event: MapMouseEvent) {
      if (positionControl.container) {
        positionControl.container.innerHTML = `Lat/Lon: (${event.lngLat.lat.toFixed(4)}; ${event.lngLat.lng.toFixed(4)})`;
      }
    });
    map.on('mouseout', function () {
      if (positionControl.container) {
        positionControl.container.innerHTML = '';
      }
    });
  }

  void map.once('load', () => {
    emit('map:loaded', map as Map);
    loading.value = false;
  });
});
</script>
