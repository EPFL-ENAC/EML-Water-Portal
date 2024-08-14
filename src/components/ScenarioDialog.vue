<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.sm ? '' : 'width: 500px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          {{ $t('scenario_for_watershed', { name: stationName }) }}
        </div>
        <div>
          <scenario-panel v-model="watershedScenario" class="q-pa-md" />
        </div>
      </q-card-section>
      <q-card-actions v-if="$q.screen.gt.xs" align="right">
        <q-btn flat :label="$t('cancel')" color="grey-6" v-close-popup />
        <q-btn v-show="hasWatershedScenario" flat :label="$t('remove')" color="secondary" @click="onRemove" v-close-popup />
        <q-btn flat :label="$t('apply')" color="primary" @click="onApply" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
export default defineComponent({
  name: 'ScenarioDialog',
});
</script>
<script setup lang="ts">
import ScenarioPanel from 'src/components/modelling/ScenarioPanel.vue';
import { Scenario } from 'src/stores/scenarii';

interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'apply', 'remove'])

const mapStore = useMapStore();
const scenariiStore = useScenariiStore();

const showDialog = ref(props.modelValue);

const bvProperties = computed(() => mapStore.bvSelected?.properties);
const stationName = computed(() => bvProperties.value?.stationName);
const hasWatershedScenario = computed(() => scenariiStore.scenarii.find((s) => s.watershed === stationName.value) !== undefined)
const watershedScenario = ref<Scenario>(scenariiStore.makeScenario(stationName.value));

watch(() => props.modelValue, (value) => {
  showDialog.value = value;
  if (value) {
    watershedScenario.value = scenariiStore.scenarii.find((s) => s.watershed === stationName.value) || scenariiStore.makeScenario(stationName.value);
  }
});


function onHide() {
  emit('update:modelValue', false);
}

function onApply() {
  if (watershedScenario.value) {
    scenariiStore.applyScenario(watershedScenario.value);
    emit('apply', watershedScenario.value);
  }
}

function onRemove() {
  if (watershedScenario.value) {
    scenariiStore.removeScenario(watershedScenario.value);
    emit('remove', watershedScenario.value);
  }
}

</script>