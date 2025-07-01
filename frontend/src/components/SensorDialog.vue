<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.sm ? '' : 'width: 800px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          {{ t('sensor_label', {name: sensorProperties?.name}) }} 
          <q-chip :label="getLabel(locale, sensorSpec?.title)" size="sm" class="q-ml-sm" color="primary" text-color="white" />
        </div>
        <div>
          <q-list dense v-if="sensorProperties" separator>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('location_name') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <span>{{ info?.site_name || sensorProperties.locationName }}</span>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('installation') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-markdown
                  no-heading-anchor-links
                  :src="getLabel(locale, info?.site_description)" class="q-mt-sm" />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('device_model') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <span>{{ info?.model || sensorProperties.sensor }}</span>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('parameters') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <ul class="q-pl-md">
                <template v-for="measure in sensorMeasures" :key="measure">
                  <li>{{ t(`measure.${measure.replaceAll(' ', '_')}.label`) }}</li>
                </template>
              </ul>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('color') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-icon name="circle" :style="{ color: sensorProperties.color }" size="sm"/>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section class="section-title">
                <q-item-label header class="text-overline q-pa-none">{{ t('filter_data') }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-checkbox v-model="selected" dense @update:model-value="onSelectionUpdate" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>
      <q-card-actions v-if="$q.screen.gt.xs" align="right">
        <q-btn flat :label="t('close')" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { MeasureOptions, SensorSpecs } from 'src/utils/options';
import { getLabel } from 'src/utils/misc';
import { type SensorInfo } from 'src/models';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const helpStore = useHelpStore();
const { t, locale } = useI18n();

const showDialog = ref(props.modelValue);
const selected = ref<boolean>(false);
const info = ref<SensorInfo | undefined>();

watch(
  () => props.modelValue,
  async (value) => {
    showDialog.value = value;
    selected.value = filtersStore.sensors.includes(mapStore.sensorSelected?.properties.name) || false;
    try {
      info.value = await helpStore.getSensorInfo(mapStore.sensorSelected?.properties.name);
    } catch (error) {
      console.error('Error retrieving sensor info:', error);
      info.value = undefined; // Fallback value
    }
  },
);

const sensorProperties = computed(() => mapStore.sensorSelected?.properties);

const sensorSpec = computed(() => sensorProperties.value?.name ? SensorSpecs.find((ss) => ss.locations.includes(sensorProperties.value?.name)) : null);

const sensorMeasures = computed(() => sensorProperties.value?.measures
  .split('|')
  .map((m: string) => MeasureOptions.find((mo) => mo.key === m)?.key || m.replaceAll('_',' ')) || []);

function onHide() {
  emit('update:modelValue', false);
}

function onSelectionUpdate() {
  if (!sensorProperties.value) return;
  filtersStore.toggleSensor(sensorProperties.value.name);
}
</script>

<style scoped>
.section-title {
  max-width: 150px;
}
</style>
