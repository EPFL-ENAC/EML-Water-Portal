<template>
  <div>
    <div v-if="option.series" :style="`height: ${height}px;`">
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
import { SVGRenderer } from 'echarts/renderers';
import { initOptions, updateOptions } from './utils';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';

use([
  SVGRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
]);

interface Props {
  measure: string,
  height?: number;
}
const props = withDefaults(defineProps<Props>(), {
  height: 300,
});

const measuresStore = useMeasuresStore();

const chart = shallowRef(null);
const option = ref<EChartsOption>({});
const loading = ref(false);

const sensors = computed(() => measuresStore.datasets ? measuresStore.datasets?.sensors.filter((sensor) => sensor.columns.find((col) => col.measure === props.measure && col.data)) : [])

onMounted(initChartOptions)

watch(
  [() => measuresStore.loading, () => sensors.value],
  () => {
    initChartOptions();
  }
)

function initChartOptions() {
  if (sensors.value.length === 0 || measuresStore.loading) {
    return;
  }
  option.value = {};
  buildOptions();
}

function buildOptions() {
  loading.value = true;
  const newOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        animation: false
      }
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: 'all'
        }
      ]
    },
    dataZoom: [
      {
        show: true,
        realtime: true,
        start: 90,
        end: 100,
        xAxisIndex: [0, 1]
      },
      // {
      //   type: 'inside',
      //   realtime: true,
      //   start: 0,
      //   end: 100,
      //   xAxisIndex: [0, 1]
      // }
    ],
    grid: [
      {
        top: 20,
        left: 30,
        right: 20,
        bottom: 30
      },
    ],
    xAxis: sensors.value.map((s) => {
      return {
        type: 'time',
        boundaryGap: false,
      }
    }),
    yAxis: [
      {
        //name: `${props.measure} <unit>`,
        type: 'value',
      },
    ],
    series: sensors.value.map((s) => {
      const timestamps = s.columns.find((col) => col.measure === 'timestamp')?.data;
      const colData = s.columns.find((col) => col.measure === props.measure)?.data;
      return {
        name: s.name,
        type: 'line',
        symbolSize: 0,
        data: timestamps?.map((t, index) => [t, colData ? colData[index] : 0]) 
      };
    })
};
  option.value = newOption;
  loading.value = false;
}

</script>