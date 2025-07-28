<template>
  <q-dialog :maximized="$q.screen.lt.sm" v-model="showDialog" @hide="onHide">
    <q-card :style="$q.screen.lt.sm ? '' : 'width: 500px; max-width: 80vw'">
      <q-card-actions v-if="$q.screen.lt.sm" align="right">
        <q-btn flat icon="close" color="primary" v-close-popup />
      </q-card-actions>
      <q-tabs
        v-model="tab"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="scenarios" :label="t('scenarios')" />
        <q-tab name="design" :label="t('design')" />
      </q-tabs>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="scenarios">
          <div class="text-h6 q-mb-sm">
            {{ t('scenarios_for_watershed', { name: stationName }) }}
          </div>
          <div>
            <q-list
              v-if="watershedScenarii.length"
              bordered
              separator
              class="q-mb-md"
            >
              <template
                v-for="scenario in watershedScenarii"
                :key="scenario.name"
              >
                <q-item :class="{ 'item-disabled': !scenario.enabled }" >
                  <q-item-section>
                    <q-item-label
                      class="q-mb-xs"
                    >
                      <q-checkbox
                        v-model="scenario.enabled"
                        dense
                        :style="{ position: 'relative', top: '-0.1rem' }"
                      />
                      <span
                        :style="{ color: scenario.lineColor, fontSize: '1.2rem', position: 'relative', top: '0.06rem', fontWeight: 'bold' }"
                        class="q-ml-xs q-mr-xs"
                      >
                      --
                      </span>
                      {{ scenario.name }}
                    </q-item-label>
                    <div>
                      <q-badge color="grey-7">{{
                        `${t('tank_volume')}: ${scenario.tank}`
                      }}</q-badge>
                      <q-badge color="grey-7">{{
                        `${t('roof_to_tank')}: ${scenario.roofToTank}`
                      }}</q-badge>
                      <q-badge color="grey-7">{{
                        `${t('flushing_frequency')}: ${scenario.flushingFrequency}`
                      }}</q-badge>
                      <q-badge color="grey-7" v-if="scenario.useCustomPercentPaved">{{
                        `${t('custom_percent_paved')}: ${scenario.customPercentPaved}%`
                      }}</q-badge>
                    </div>
                    <div>
                      <q-icon
                        :name="getVegetationIcon(scenario.vegetation)"
                        :title="t(scenario.vegetation)"
                      />
                    </div>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-grey-8 q-gutter-xs">
                      <q-btn
                        class="gt-xs"
                        size="12px"
                        flat
                        dense
                        round
                        icon="edit"
                        @click="onEdit(scenario)"
                      />
                      <q-btn
                        class="gt-xs"
                        size="12px"
                        flat
                        dense
                        round
                        icon="delete"
                        @click="onRemove(scenario)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
            <q-btn
              :label="t('add_scenario')"
              color="secondary"
              icon="add"
              size="sm"
              @click="onAdd"
            />
          </div>
        </q-tab-panel>
        <q-tab-panel name="design">
          <div class="text-h6 q-mb-sm">
            {{ t('design_for_watershed', { name: stationName }) }}
          </div>
          <design-tab :watershed="stationName" />
        </q-tab-panel>
      </q-tab-panels>
      <q-card-actions v-if="$q.screen.gt.xs" align="right">
        <q-btn flat :label="t('close')" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
    <scenario-dialog
      v-model="showScenario"
      :scenario="selectedScenario"
      @remove="onRemove"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import type { Scenario } from 'src/stores/scenarii';
import ScenarioDialog from 'src/components/ScenarioDialog.vue';
import DesignTab from 'src/components/DesignTab.vue';
import { VegetationIcons } from 'src/utils/icons';

interface Props {
  modelValue: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const tab = ref('scenarios');

watch(
  () => props.modelValue,
  (value) => {
    showDialog.value = value;
  },
);

const $q = useQuasar();
const { t } = useI18n();
const mapStore = useMapStore();
const scenariiStore = useScenariiStore();

const showDialog = ref(props.modelValue);
const showScenario = ref(false);

const bvProperties = computed(() => mapStore.bvSelected?.properties);
const stationName = computed(() => bvProperties.value?.stationName);
const watershedScenarii = computed(() =>
  scenariiStore.scenarii.filter((s) => s.watershed === stationName.value),
);

const selectedScenario = ref<Scenario>(
  scenariiStore.makeScenario(stationName.value),
);

function onHide() {
  emit('update:modelValue', false);
}

function onEdit(scenario: Scenario) {
  selectedScenario.value = { ...scenario };
  showScenario.value = true;
}

function onAdd() {
  selectedScenario.value = scenariiStore.makeScenario(stationName.value);
  selectedScenario.value.name = `Scenario ${watershedScenarii.value.length + 1}`;
  showScenario.value = true;
}

function onRemove(scenario: Scenario) {
  scenariiStore.removeScenario(scenario);
}

function getVegetationIcon(vegetation: string) {
  return VegetationIcons.find((v) => v.value === vegetation)?.name;
}
</script>

<style scoped>

.item-disabled {
  opacity: 0.6;
}

</style>
