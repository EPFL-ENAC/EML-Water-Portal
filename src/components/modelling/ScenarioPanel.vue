<template>
  <div>
    <div>{{ $t('tank_volume') }}</div>
    <q-slider
      v-model="selected.tank"
      :min="0" 
      :max="1000"
      :step="100"
      debounce="300"
      label
      marker-labels
      @update:model-value="onUpdate"
      class="q-mb-md" />
    <div>{{ $t('soil_infiltration') }}</div>
    <q-slider
      v-model="selected.soilInfiltration"
      :min="0"
      :max="10"
      debounce="300"
      label
      marker-labels
      @update:model-value="onUpdate"
      class="q-mb-md" />
    <div>{{ $t('paved_area') }}</div>
    <q-slider
      v-model="selected.pavedArea"
      :min="0"
      :max="100"
      debounce="300"
      label
      markers
      :marker-labels="pctMarkerLabels"
      @update:model-value="onUpdate"
      class="q-mb-md" />
    <div>{{ $t('water_reuse') }}</div>
    <div>
      <q-checkbox
        v-model="selected.waterReuseIrrigation"
        :label="$t('irrigation')"
        @update:model-value="onUpdate" />
      <q-checkbox
        v-model="selected.waterReuseToilet"
        :label="$t('toilet_flushing')"
        @update:model-value="onUpdate"
        class="on-right" />
    </div>
  </div>
  
</template>

<script lang="ts">
export default defineComponent({
  name: 'ScenarioPanel',
});
</script>
<script setup lang="ts">
import { Scenario } from 'src/stores/scenarii';

interface Props {
  modelValue: Scenario
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const selected = ref({ ...props.modelValue })

const pctMarkerLabels = computed(() => {
  const obj = {};
  for (let i = 0; i <= 10; i++) {
    // eslint-disable-next-line
    obj[i * 10] = `${i * 10}%`;
  }
  return obj;
})

function onUpdate() {
  if (!props.modelValue) return;
  emit('update:modelValue', selected.value);
}
</script>