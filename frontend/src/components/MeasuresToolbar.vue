<template>
  <div>
    <div class="container">
      <div class="time-item q-ma-md">
        <time-range-slider player style="min-height: 70px;" />
      </div>
      <div class="actions-item q-ma-md">
        <q-btn
          :title="t('download_data')"
          :disable="measuresStore.loading"
          icon="download"
          color="secondary"
          size="xs"
          class="q-mr-sm"
          @click="showDownload = true"
        />
        <q-btn
          :title="t('charts_height')"
          :disable="measuresStore.loading"
          icon="height"
          size="xs"
          class="q-mr-sm"
        >
          <q-menu class="q-pa-sm">
            <div class="text-caption q-mb-sm">{{ t('charts_height') }}</div>
            <q-slider
              v-model="chartHeight"
              :disable="measuresStore.loading"
              :min="100"
              :max="500"
              :step="50"
              :label-value="chartHeight + ' px'"
              switch-label-side
              debounce="300"
              class="q-pl-sm q-pr-sm"
              @update:model-value="emit('chartHeightChange', chartHeight)"
            />
          </q-menu>
        </q-btn>
        <q-btn-toggle
          v-model="colsSpan"
          :disable="measuresStore.loading"
          toggle-color="primary"
          :options="[
            {value: '12', slot: 'one'},
            {value: '6', slot: 'two'},
          ]"
          size="xs"
          @update:model-value="emit('colsSpanChange', colsSpan)"
        >
          <template v-slot:one>
            <div class="row items-center no-wrap">
              <q-icon name="splitscreen" />
            </div>
          </template>

          <template v-slot:two>
            <div class="row items-center no-wrap">
              <q-icon name="grid_view" />
            </div>
          </template>
        </q-btn-toggle>
      </div>
    </div>

    <download-dialog v-model="showDownload" />

  </div>
</template>

<script setup lang="ts">
import TimeRangeSlider from 'src/components/charts/TimeRangeSlider.vue';
import DownloadDialog from 'src/components/DownloadDialog.vue';

const { t } = useI18n();
const measuresStore = useMeasuresStore();

const chartHeight = ref(200);
const colsSpan = ref('6');
const showDownload = ref(false);

const emit = defineEmits(['colsSpanChange', 'chartHeightChange']);
</script>

<style scoped>
.container {
  display: grid;
}

.actions-item {
  width: 200px;
  display: flex;
  align-items: center;
}

@media (min-width: 1024px) {
  .container {
    grid-template-columns: 1fr auto;
    grid-template-rows: none;
  }
}

@media (max-width: 1023px) {
  .container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .actions-item {
    width: 100%; /* to avoid overflow on small screens */
  }
}

</style>
