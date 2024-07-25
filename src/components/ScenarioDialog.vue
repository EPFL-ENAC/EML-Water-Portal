<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.sm ? '' : 'width: 500px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          {{ $t('scenario_for_watershed', { name: bvProperties.stationName }) }}
        </div>
        <div>
          <pre>{{ bvProperties }}</pre>
        </div>
      </q-card-section>
      <q-card-actions v-if="$q.screen.gt.xs" align="right">
        <q-btn flat :label="$t('close')" color="primary" v-close-popup />
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
interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const mapStore = useMapStore();

const showDialog = ref(props.modelValue);

const bvProperties = computed(() => mapStore.bvSelected?.properties);

watch(() => props.modelValue, (value) => {
  showDialog.value = value;
});

function onHide() {
  emit('update:modelValue', false);
}

</script>