<template>
  <div>
    <div v-if="sensors.length === 0" class="text-center text-help q-pa-sm">
      {{ $t('no_sensor_selected', { measure: props.label }) }}
    </div>
    <div v-else-if="!option.series" class="text-center text-help q-pa-sm">
      {{ $t('no_sensor_data', { measure: props.label }) }}
    </div>
    <div v-else :style="`height: ${height}${heightUnit}; width: 100%;`">
      <e-charts
        ref="chart"
        autoresize
        :init-options="initOptions"
        :option="option"
        :update-options="updateOptions"
        :loading="loading"
        @highlight="onHighlight"
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
import type { EChartsOption, ECElementEvent } from 'echarts';
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
  label: string;
  height?: number;
  heightUnit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  heightUnit: 'px',
});

// Keep it in case new feature requires this trick
// const onDataZoomChange = (e: ECElementEvent) => {
//   if (!e.batch || !props.range) return;
//   const { start, end } = e.batch[0];
//   const rangeMs = props.range.map((r) => r.getTime());
//   const diff = rangeMs[1] - rangeMs[0];
//   const startMs = rangeMs[0] + (diff * start) / 100;
//   const endMs = rangeMs[1] + (diff * end) / 100;
//   emits('dataZoomChange', [new Date(startMs), new Date(endMs)]);
// };

// emits('axisPointerChange', e.event.value);

const measuresStore = useMeasuresStore();
const timeseriesStore = useTimeseriesChartsStore();
const filtersStore = useFiltersStore();

const chart = shallowRef<typeof ECharts | null>(null);

const option = ref<EChartsOption>({});
const loading = ref(false);

const sensors = computed(() =>
  measuresStore.datasets
    ? measuresStore.datasets?.sensors.filter((sensor) => {
        const selected =
          filtersStore.sensors.length === 0 ||
          filtersStore.sensors.includes(sensor.name);
        return (
          selected &&
          sensor.columns.find(
            (col) => col.measure === props.measure && col.data,
          )
        );
      })
    : [],
);

const timestamps = computed(() =>
  sensors.value.length > 0
    ? sensors.value[0].columns.find((col) => col.measure === 'timestamp')?.data
    : [],
);

function initChartOptions() {
  if (measuresStore.loading) {
    return;
  }
  option.value = {};
  buildOptions();
}

const onHighlight = (e: ECElementEvent) => {
  const idx = e.batch[0].dataIndex;
  const timestamp = timestamps.value
    ? new Date(timestamps.value[idx])
    : undefined;
  timeseriesStore.axisPointer = timestamp;
};

onMounted(() => {
  initChartOptions();
});

watch([() => measuresStore.loading, () => sensors.value], () => {
  initChartOptions();
});

watch(() => [timeseriesStore.timeRange], onRangeChange);

function onRangeChange() {
  if (chart.value !== null && timeseriesStore.timeRange !== undefined) {
    if (chart.value !== null) {
      chart.value.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        startValue: timeseriesStore.timeRange[0],
        endValue: timeseriesStore.timeRange[1],
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
        left: 60,
        right: 10,
        bottom: 20,
      },
    ],
    xAxis: [
      {
        type: 'time',
        min: timeseriesStore.MIN_DATE,
        max: timeseriesStore.MAX_DATE,
        axisLabel: {
          formatter: function (value) {
            var date = new Date(value);
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          },
        },
      },
    ],
    yAxis: [
      {
        name: props.label,
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontWeight: 'bold',
        },
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
        showSymbol: false,
        animation: false,
        large: true,
        symbol: 'none',
        symbolSize: 0,
        type: 'line',
        data: timestamps?.map((t, index) => [t, colData ? colData[index] : 0]),
      };
    }),
  };

  option.value = newOption;
  loading.value = false;
}
</script>
