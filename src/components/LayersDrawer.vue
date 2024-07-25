<template>
  <q-list>
    <q-item-label header class="text-h6">
      <q-icon name="model_training" class="q-pb-xs"/>
      <span class="q-ml-sm">{{ $t('scenario') }}</span>
    </q-item-label>
    <q-item>
      <div class="text-help">{{ $t('scenario_info') }}</div>
    </q-item>
    <q-item-label header class="text-h6">
      <q-icon name="layers" class="q-pb-xs"/>
      <span class="q-ml-sm">{{ $t('layers') }}</span>
    </q-item-label>
    <q-item
      v-for="layer in mainLayerSelections"
      :key="layer.id"
      class="q-pt-none q-pb-none q-pl-sm q-pr-sm"
    >
      <q-item-section>
        <q-checkbox
          v-model="layer.visible"
          :label="$t(`layer.${layer.id}`)" 
          @click="onToggleLayer(layer.id)"
        />
      </q-item-section>
      <q-item-section avatar>
        <q-btn 
          flat
          round
          icon="help_outline"
          @click="helpStore.toggleHelp(layer.id)"
        />
      </q-item-section>
    </q-item>
    <q-list>
      <q-expansion-item
        header-class="text-secondary"
        :label="$t('other_layers')"
      >
        <q-item
          v-for="layer in otherLayerSelections"
          :key="layer.id"
          class="q-pt-none q-pb-none q-pl-sm q-pr-sm"
        >
          <q-item-section>
            <q-checkbox
              v-model="layer.visible"
              :label="$t(`layer.${layer.id}`)" 
              @click="onToggleLayer(layer.id)"
            />
          </q-item-section>
          <q-item-section avatar>
            <q-btn 
              flat
              round
              icon="help_outline"
              @click="helpStore.toggleHelp(layer.id)"
            />
          </q-item-section>
        </q-item>
      </q-expansion-item>
    </q-list>
    <q-item-label header>
      <span class="text-h6">
        <q-icon name="filter_alt" class="q-pb-xs"/>
        <span class="q-ml-sm">{{ $t('filters') }}</span>
      </span>
      <q-btn
        flat
        no-caps
        color="primary"
        size="12px"
        icon="restart_alt"
        :label="$t('reset_filters')"
        @click="onResetFilters" 
        class="q-mt-xs q-pl-xs q-pr-xs float-right "/>
    </q-item-label>
    <q-item>
      <span v-if="mapStore.sensorsFilter.length === 0" class="text-help">{{ $t('sensors_to_filter_info') }}</span>
      <span v-else>{{ filterLabel }}</span>
    </q-item>
    <q-item-label header class="text-h6">
      <q-icon name="info" class="q-pb-xs"/>
      <span class="q-ml-sm">{{ $t('legends') }}</span>
    </q-item-label>
    <q-item-label>
      <span class="q-ml-md">{{ $t('sensors') }}</span>
    </q-item-label>
    <q-item v-for="sensor in sensorColors" :key="sensor.color">
      <q-item-section avatar>
        <q-avatar :style="`background: ${sensor.color}`" text-color="grey-3">{{ sensor.label }}</q-avatar>
      </q-item-section>
      <q-item-section>{{ sensor.device }}</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
export default defineComponent({
  name: 'LayersDrawer',
});
</script>
<script setup lang="ts">
const mapStore = useMapStore();
const helpStore = useHelpStore();
const filtersStore = useFiltersStore();

const mainLayersIds = ['river', 'bv', 'sensors', 'conduite_principale_ec'];

const mainLayerSelections = computed(() => mapStore.layerSelections.filter((layer) => mainLayersIds.includes(layer.id)))
const otherLayerSelections = computed(() => mapStore.layerSelections.filter((layer) => !mainLayersIds.includes(layer.id)))

const filterLabel = computed(() => mapStore.sensorsFilter.join(', '));

const sensorColors = [
  {
    color: '#9400D3',
    label: 'A',
    device: 'In-Situ'
  },  
  {
    color: '#3FD400',
    label: 'B',
    device: 'Ruskin'
  },
  {
    color: '#51bbd6',
    label: 'C',
    device: 'Ijinus'
  }
]

function onToggleLayer(layerId: string) {
  mapStore.applyLayerVisibility(layerId);
  onUpdatedFilter();
}

function onResetFilters() {
  filtersStore.reset();
  mapStore.resetSensorFilters();
  onUpdatedFilter();
}

function onUpdatedFilter() {
  mapStore.applyFilters(filtersStore.asParams());
}
</script>