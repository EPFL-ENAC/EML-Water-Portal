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
      :min="10"
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

  <div>
    <q-checkbox
      v-model="selected.useCustomPercentPaved"
      :label="$t('use_custom_percent_paved')"
      @update:model-value="onUpdate"
    />

    <q-slider
      v-if="selected.useCustomPercentPaved"
      v-model="selected.customPercentPaved"
      :min="0"
      :max="99"
      :step="1"
      debounce="300"
      label
      :marker-labels="percentPavedMarkerLabels"
      @update:model-value="onUpdate"
    />
  </div>

  <div class="q-mt-md">{{ $t('line_color') }}</div>
  <q-input
    v-model="selected.lineColor"
    filled
    dense
    readonly
    @update:model-value="onUpdate"
  >
    <template v-slot:prepend>
      <q-icon
      name="circle"
      :style="{ color: selected.lineColor }"
      size="1.2rem"
    />
    </template>
    <template v-slot:append>
      <q-icon name="colorize" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-color
            v-model="selected.lineColor"
            :palette="colors"
            @update:model-value="onUpdate"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script lang="ts">
export default defineComponent({
  name: 'ScenarioPanel',
});
</script>
<script setup lang="ts">
import { Scenario, colors } from 'src/stores/scenarii';
import { VegetationIcons } from 'src/utils/icons';

interface Props {
  modelValue: Scenario;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const selected = ref({ ...props.modelValue });

const tankMarkerLabels = computed(() => {
  const obj = {};
  obj[10] = '10';
  for (let i = 1; i <= 10; i++) {
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

const percentPavedMarkerLabels = computed(() => {
  const obj = {};
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line
    obj[i * 20] = `${i * 20}%`;
  }
  obj[99] = '99%';
  return obj;
});

function onUpdate() {
  if (!props.modelValue) return;
  emit('update:modelValue', selected.value);
}
</script>
