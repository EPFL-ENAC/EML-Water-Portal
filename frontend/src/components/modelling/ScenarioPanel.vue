<template>
  <div>
    <q-input
      v-model="selected.name"
      :label="$t('name')"
      @update:model-value="onUpdate"
      class="q-mb-md"
    />

    <div>{{ $t('tank_volume') }}</div>
    <q-slider
      v-model="selected.tank"
      :min="0"
      :max="5000"
      :step="10"
      debounce="300"
      label
      :marker-labels="tankMarkerLabels"
      @update:model-value="onUpdate"
      class="q-mb-md"
    />

    <div>{{ $t('roof_to_tank') }}</div>
    <q-slider
      v-model="selected.roofToTank"
      :min="0.1"
      :max="1"
      :step="0.1"
      debounce="300"
      label
      :marker-labels="rt2tkMarkerLabels"
      @update:model-value="onUpdate"
      class="q-mb-md"
    />

    <div>{{ $t('flushing_frequency') }}</div>
    <q-slider
      v-model="selected.flushingFrequency"
      :min="0"
      :max="50"
      :step="0.1"
      debounce="300"
      label
      :marker-labels="ffMarkerLabels"
      @update:model-value="onUpdate"
      class="q-mb-md"
    />
  </div>

  <div>{{ $t('vegetation') }}</div>
    <div class="q-gutter-sm q-mb-md">
      <template v-for="vege in VegetationIcons" :key="vege.value">
        <q-radio
          v-model="selected.vegetation"
          :checked-icon="vege.name"
          :unchecked-icon="vege.name"
          :val="vege.value"
          :title="$t(vege.value)"
          @update:model-value="onUpdate"
        />
      </template>
    </div>

  <q-checkbox
    v-model="selected.useHistoricalData"
    :label="$t('use_historical_data')"
    @update:model-value="onUpdate"
    class="q-mb-md"
  />
</template>

<script lang="ts">
export default defineComponent({
  name: 'ScenarioPanel',
});
</script>
<script setup lang="ts">
import { Scenario } from 'src/stores/scenarii';
import { VegetationIcons } from 'src/utils/icons';

interface Props {
  modelValue: Scenario;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const selected = ref({ ...props.modelValue });

const tankMarkerLabels = computed(() => {
  const obj = {};
  for (let i = 0; i <= 5; i++) {
    // eslint-disable-next-line
    obj[i * 1000] = `${i * 1000}`;
  }
  return obj;
});

const rt2tkMarkerLabels = computed(() => {
  const obj = {};
  for (let i = 1; i <= 10; i++) {
    // eslint-disable-next-line
    obj[i * 0.1] = `${(i / 10).toFixed(1)}`;
  }
  return obj;
});

const ffMarkerLabels = computed(() => {
  const obj = {};
  for (let i = 0; i <= 5; i++) {
    // eslint-disable-next-line
    obj[i * 10] = `${i * 10}`;
  }
  return obj;
});

function onUpdate() {
  if (!props.modelValue) return;
  emit('update:modelValue', selected.value);
}
</script>
