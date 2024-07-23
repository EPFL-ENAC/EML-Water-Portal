<template>
  <div v-if="option.series" :style="`height: ${height + 300}px;`">
    <e-charts
      ref="chart"
      autoresize
      :init-options="initOptions"
      :option="option"
      :update-options="updateOptions"
      class="q-ma-md"
      :loading="loading"
    />
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
import { timeData, data1, data2 } from 'src/utils/faker';
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
  source: string,
  height?: number;
}
const props = withDefaults(defineProps<Props>(), {
  height: 300,
});

const chart = shallowRef(null);
const option = ref<EChartsOption>({});
const loading = ref(false);

onMounted(initChartOptions)

watch(
  () => props.source,
  () => {
    initChartOptions();
  }
);

function initChartOptions() {
  option.value = {};
  buildOptions();
}

function buildOptions() {
  loading.value = true;

  loading.value = false;

  const newOption: EChartsOption = {
    // title: {
    //   text: props.source,
    //   left: 'center'
    // },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        animation: false
      }
    },
    legend: {
      data: [props.source],
      left: 10
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        restore: {},
        saveAsImage: {}
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
        start: 30,
        end: 70,
        xAxisIndex: [0, 1]
      },
      {
        type: 'inside',
        realtime: true,
        start: 30,
        end: 70,
        xAxisIndex: [0, 1]
      }
    ],
    grid: [
      {
        left: 60,
        right: 50,
        //height: '70%'
      },
      // {
      //   left: 60,
      //   right: 50,
      //   top: '55%',
      //   height: '35%'
      // }
    ],
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        axisLine: { onZero: true },
        data: timeData
      },
      // {
      //   gridIndex: 1,
      //   type: 'category',
      //   boundaryGap: false,
      //   axisLine: { onZero: true },
      //   data: timeData,
      //   position: 'top'
      // }
    ],
    yAxis: [
      {
        name: `${props.source} <unit>`,
        type: 'value',
        max: 500
      },
      // {
      //   gridIndex: 1,
      //   name: 'Rainfall(mm)',
      //   type: 'value',
      //   inverse: true
      // }
    ],
    series: [
      {
        name: props.source,
        type: 'line',
        symbolSize: 8,
        // prettier-ignore
        data: data1
      },
      // {
      //   name: 'Rainfall',
      //   type: 'line',
      //   xAxisIndex: 1,
      //   yAxisIndex: 1,
      //   symbolSize: 8,
      //   // prettier-ignore
      //   data: data2
      // }
  ]
};
  option.value = newOption;
  loading.value = false;
}

</script>