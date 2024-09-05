<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.sm ? '' : 'width: 500px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-card-section>
        <div class="text-h6 q-mb-sm">
        </div>
        <div>
          <pre>{{ sensorProperties }}</pre>
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
  name: 'SensorDialog',
});
</script>
<script setup lang="ts">

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const mapStore = useMapStore();

const showDialog = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    showDialog.value = value;
  },
);

const sensorProperties = computed(() => mapStore.sensorSelected?.properties);

function onHide() {
  emit('update:modelValue', false);
}
</script>
