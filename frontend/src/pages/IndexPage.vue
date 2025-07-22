<template>
  <q-page id="q-page-content" style="display: flex;">
    <div id="tooltip-container" class="flex"></div>

    <div class="row" style="flex: 1;">
      <div class="col-12 col-md-3 bg-grey-2">
        <measures-sidebar />
      </div>
      <div class="col-12 col-md-9">
        <div class="bg-white" style="position: sticky; top: 53px; z-index: 1000;">
          <measures-toolbar @cols-span-change="onColsSpanChanged" @chart-height-change="onChartHeightChanged" />
          <q-separator />
        </div>
        <template v-for="category in ['parameters_measured', 'parameters_scenario']" :key="category">
          <q-item-label header class="text-h6">{{
            t(category)
          }}</q-item-label>
          <div v-if="category === 'parameters_scenario'">
            <q-item>
              <div v-if="scenariiStore.scenarii.length === 0" class="text-help">
                {{ t('scenario_info') }}
              </div>
              <div v-else>
                <q-chip
                  v-for="scenario in scenariiStore.scenarii"
                  :key="`${scenario.watershed}:${scenario.name}`"
                  :class="{ 'chip-disabled': !scenario.enabled }"
                  removable
                  @remove="onRemoveScenario(scenario)"
                  size="sm"
                >
                  <q-checkbox
                    v-model="scenario.enabled"
                    dense
                    size="xs"
                  />
                  <span
                    :style="{ color: scenario.lineColor, fontSize: '1.2rem', position: 'relative', top: '-0.1rem', fontWeight: 'bold' }"
                    class="q-mr-xs q-ml-xs"
                  >
                  --
                  </span>
                  {{ `${scenario.watershed}: ${scenario.name}` }}
                </q-chip>
              </div>
            </q-item>
          </div>
          <div v-if="measuresFiltered(category).some((measure) => measuresVisible[measure.key])" class="row">
            <template
              v-for="measure in measuresFiltered(category)"
              :key="measure.key"
            >
              <div v-show="measuresVisible[measure.key]" :class="colsClass">
                <q-card square bordered flat>
                  <q-card-section>
                    <timeseries-chart
                      :measure="measure.key"
                      :label="t(`measure.${measure.key}.axis_label`)"
                      :unit="measure.unit"
                      :precision="measure.precision"
                      :height="chartHeight"
                      stacked
                    />
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </div>
          <div v-else class="text-help q-ml-md">
            {{ t('no_measure_selected') }}
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import TimeseriesChart from 'src/components/charts/TimeseriesChart.vue';
import MeasuresToolbar from 'src/components/MeasuresToolbar.vue';
import MeasuresSidebar from 'src/components/MeasuresSidebar.vue';
import type { Settings } from 'src/stores/settings';
import {
  MeasureOptions,
} from 'src/utils/options';
import type { Scenario } from 'src/stores/scenarii';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const mapStore = useMapStore();
const filtersStore = useFiltersStore();
const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();

const colsSpan = ref('6');
const colsClass = computed(() => `col-12 col-md-${colsSpan.value}`);
const chartHeight = ref(200);

const measuresVisible = ref<Record<string, boolean>>(
  settingsStore.settings?.measuresVisible || {},
);

onMounted(() => {
  measuresStore.loadDatasets().catch((err) => {
    console.error('Error loading datasets:', err);
  });
});

watch(
  [() => scenariiStore.scenarii, () => filtersStore.sensors],
  () => {
    mapStore.applyState();
  },
  { deep: true },
);

watch(() => measuresVisible.value, onMeasureVisibilityChange, { deep: true });

const measuresFiltered = (category: string) => {
  return MeasureOptions.filter((m) => m.is_scenario_measure === (category === 'parameters_scenario'));
};

function onMeasureVisibilityChange() {
  settingsStore.saveSettings({
    measuresVisible: measuresVisible.value,
  } as Settings);
}

function onRemoveScenario(scenario: Scenario) {
  scenariiStore.removeScenario(scenario);
}


function onColsSpanChanged(newSpan: string) {
  colsSpan.value = newSpan;
}

function onChartHeightChanged(newHeight: number) {
  chartHeight.value = newHeight;
}
</script>

<style scoped>
.chip-disabled {
  opacity: 0.6;
}
</style>
