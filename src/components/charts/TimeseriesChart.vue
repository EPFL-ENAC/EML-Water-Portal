<template>
  <div>
    <div v-if="option.series" :style="`height: ${height}px; width: 100%;`">
      <e-charts
        ref="chart"
        autoresize
        :init-options="initOptions"
        :option="option"
        :update-options="updateOptions"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'TimeseriesChart',
});
</script>
<script setup lang="ts">
import ECharts from 'vue-echarts';
import type { EChartsOption } from 'echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { initOptions, updateOptions } from './utils';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { debounce } from 'quasar';

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
]);

interface Props {
  measure: string;
  height?: number;
  rangeMin?: Date;
  rangeMax?: Date;
  isExpanded?: boolean;
  debounceTime?: number;
  range?: [Date, Date];
}
const props = withDefaults(defineProps<Props>(), {
  height: 300,
  rangeMin: undefined,
  rangeMax: undefined,
  isExpanded: true,
  debounceTime: 20,
  range: undefined,
});

const measuresStore = useMeasuresStore();

const chart = shallowRef<typeof ECharts | null>(null);

const option = ref<EChartsOption>({});
const loading = ref(false);

const sensors = computed(() =>
  measuresStore.datasets
    ? measuresStore.datasets?.sensors.filter((sensor) =>
        sensor.columns.find((col) => col.measure === props.measure && col.data),
      )
    : [],
);

function initChartOptions() {
  if (sensors.value.length === 0 || measuresStore.loading) {
    return;
  }
  option.value = {};
  buildOptions();
}

onMounted(() => {
  initChartOptions();
});

watch([() => measuresStore.loading, () => sensors.value], () => {
  initChartOptions();
});

const debouncedRangeChange = debounce(onRangeChange, props.debounceTime);

watch(
  () => props.range,
  () => {
    if (props.isExpanded) debouncedRangeChange();
  },
);

function onRangeChange() {
  if (chart.value !== null && props.range !== undefined) {
    if (chart.value !== null && props.isExpanded) {
      chart.value.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        startValue: props.range[0],
        endValue: props.range[1],
      });
    }
  }
}

function buildOptions() {
  loading.value = true;
  const newOption: EChartsOption = {
    renderer: 'canvas',
    animation: false,
    tooltip: {
      trigger: 'axis',
      appendTo: document.getElementById('q-page-content') as HTMLElement,
      axisPointer: {
        animation: false,
      },
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: 'all',
        },
      ],
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
      },
    ],
    grid: [
      {
        top: 10,
        left: 30,
        right: 20,
        bottom: 30,
      },
    ],
    xAxis: sensors.value.map((s) => {
      return {
        type: 'time',
        min: props.rangeMin,
        max: props.rangeMax,
      };
    }),
    yAxis: [
      {
        //name: `${props.measure} <unit>`,
        type: 'value',
      },
    ],
    series: sensors.value.map((s) => {
      const timestamps = s.columns.find(
        (col) => col.measure === 'timestamp',
      )?.data;
      const colData = s.columns.find(
        (col) => col.measure === props.measure,
      )?.data;
      return {
        name: s.name,
        type: 'line',
        symbolSize: 0,
        data: timestamps?.map((t, index) => [t, colData ? colData[index] : 0]),
      };
    }),
  };
  option.value = newOption;
  loading.value = false;
}
</script>
