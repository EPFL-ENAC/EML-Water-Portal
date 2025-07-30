<template>
  <div>
    <div
      v-if="props.measure === 'water_samples'"
      class="text-center text-negative q-pa-sm"
    >
      {{ t('water_samples_data_on_demand') }}
    </div>
    <div v-else-if="sensors.length === 0 && scenarii.length === 0" class="text-center text-help q-pa-sm">
      {{ t('no_sensor_selected', { measure: props.label }) }}
    </div>
    <div v-else-if="!option.series" class="text-center text-help q-pa-sm">
      {{ t('no_sensor_data', { measure: props.label }) }}
    </div>
    <div v-else :style="`height: ${height}${heightUnit}; width: 100%;`">
      <!-- <q-spinner-dots color="primary" v-if="measuresStore.loading || loading" /> -->
      <e-charts
        ref="chart"
        autoresize
        group="timeseries"
        :init-options="initOptions"
        :option="option"
        :loading="loading"
        @highlight="onHighlight"
        @datazoom="onDataZoomChange"
        @downplay="onDownplay"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScenarioData, SensorData } from 'src/models';
import { SensorSpecs } from 'src/utils/options';
import ECharts from 'vue-echarts';
import type { EChartsOption, ECElementEvent, SeriesOption } from 'echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { initOptions } from './utils';
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
  unit?: string;
  precision?: number;
  height?: number;
  heightUnit?: string;
  stacked?: boolean; // if stacked, hide x-axis labels and propagate axis pointer selection to other charts (via store)
  zoom?: boolean; // if true, enable zooming on the chart
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  precision: 2,
  unit: '',
  heightUnit: 'px',
  zoom: false,
});

const { t } = useI18n();

const onDataZoomChange = (e: ECElementEvent) => {
  if (!e.batch || !timeseriesStore.timeRange) return;
  const { start, end } = e.batch[0];

  const { MIN_DATE_MS, DATE_RANGE_MS } = timeseriesStore;

  const startMs = MIN_DATE_MS + (DATE_RANGE_MS * start) / 100;
  const endMs = MIN_DATE_MS + (DATE_RANGE_MS * end) / 100;

  // Update only if there is an actual change to avoid unnecessary store updates
  const newStartDate = new Date(startMs);
  const newEndDate = new Date(endMs);

  if (
    timeseriesStore.timeRange[0].getTime() !== newStartDate.getTime() ||
    timeseriesStore.timeRange[1].getTime() !== newEndDate.getTime()
  ) {
    timeseriesStore.lastUpdatedChartID = props.measure;
    timeseriesStore.timeRange = [newStartDate, newEndDate];
  }
};

const measuresStore = useMeasuresStore();
const scenariiStore = useScenariiStore();
const timeseriesStore = useTimeseriesChartsStore();
const filtersStore = useFiltersStore();

const chart = shallowRef<typeof ECharts | null>(null);

const option = ref<EChartsOption>({});
const loading = ref(false);

const sensors = computed(() => {
  const rval = measuresStore.datasets
    ? measuresStore.sensors.filter((sensor) => {
        const selected =
          filtersStore.sensors.length === 0 ||
          filtersStore.sensors.includes(sensor.name);
        return (
          selected &&
          sensor.vectors.find(
            (col) => col.measure === props.measure && col.values,
          )
        );
      })
    : [];
  return rval;
});

const scenarii = computed(() => {
  return scenariiStore.scenarii
    ? scenariiStore.scenarii.filter((scenario) => {
        return (
          scenario.enabled &&
          scenario.data &&
          scenario.data.vectors.find(
            (col) => col.measure === props.measure && col.values,
          )
        );
      })
    : [];
});

// watch height and heightUnit
watch([() => props.height, () => props.heightUnit], () => {
  if (chart.value) {
    chart.value.resize();
  }
});

// Get the timestamps for all sensors
const timestamps = computed(() => {
  const rval = sensors.value.map(
    (sensor) => sensor.vectors.find((col) => col.measure === 'timestamp')?.values,
  );
  return rval;
});

const timestampsMS = computed(() => {
  const rval = timestamps.value?.map((tdata) =>
    tdata?.map((t) => t ? new Date(t).getTime() : undefined),
  );
  return rval;
});

function initChartOptions() {
  if (measuresStore.loading) {
    return;
  }
  if (option.value.series && Object.keys(option.value.series).length > 0) {
    updateOptions();
  } else {
    option.value = {};
    buildOptions();
  }
}

const onHighlight = (e: ECElementEvent) => {
  if (!props.stacked) {
    return;
  }
  let seriesIndex = -1;
  let dataIndex = -1;
  for (let i = 0; i < e.batch.length; i++) {
    if (e.batch[i].dataIndex >= 0) {
      seriesIndex = e.batch[i].seriesIndex;
      dataIndex = e.batch[i].dataIndex;
      break;
    }
  }
  let timestamp = undefined;
  if (timestamps.value && seriesIndex > -1 && dataIndex > -1) {
    const col = timestamps.value[seriesIndex];
    if (col && col[dataIndex]) {
      const val = col[dataIndex];
      // Convert to Date object if it's a timestamp
      timestamp = val === null || val === undefined ? null : new Date(val);
    }
  }

  if (timestamp) {
    if (
      timeseriesStore.axisPointer &&
      timeseriesStore.axisPointer.getTime() === timestamp.getTime()
    ) {
      return;
    }
    timeseriesStore.lastUpdatedPointerID = props.measure;
    timeseriesStore.axisPointer = timestamp;
  }
};

const onDownplay = () => {
  timeseriesStore.axisPointer = undefined;
};

onMounted(() => {
  initChartOptions();
  // delay the initial range change to ensure the chart is ready
  setTimeout(() => {
    onRangeChange();
  }, 100);
});

watch([() => measuresStore.loading, () => sensors.value], () => {
  initChartOptions();
});

watch(() => timeseriesStore.axisPointer, onPointerSelection);

function onPointerSelection() {
  if (
    chart.value !== null &&
    timeseriesStore.lastUpdatedPointerID != props.measure
  ) {
    // Show tooltip only if the chart is intersecting with the viewport
    if (timeseriesStore.axisPointer) {
      const timeMs = timeseriesStore.axisPointer.getTime();
      let seriesIndex = -1;
      let dataIndex = -1;
      for (let i = 0; i < timestampsMS.value.length; i++) {
        const timestampsMSData = timestampsMS.value[i];
        if (!timestampsMSData) {
          continue;
        }
        dataIndex = timestampsMSData.findIndex(
          (t) => Math.abs((t || 0) - timeMs) < 1000 * 60 * 15,
        );
        if (dataIndex > -1) {
          seriesIndex = i;
          break;
        }
      }
      if (dataIndex !== undefined && dataIndex > -1) {
        chart.value?.dispatchAction({
          type: 'showTip',
          seriesIndex: seriesIndex,
          dataIndex,
          position: 'inside',
        });
      } else {
        // does not apply to this chart
        chart.value?.dispatchAction({
          type: 'hideTip',
        });
      }
    } else {
      chart.value.dispatchAction({
        type: 'hideTip',
      });
    }
  }
}

watch(() => timeseriesStore.timeRange, onRangeChange);

watch(() => scenarii.value.map(scenario => scenario.data), () => {
  updateOptions();
});

function onRangeChange() {
  if (
    chart.value !== null &&
    timeseriesStore.timeRange !== undefined &&
    timeseriesStore.lastUpdatedChartID != props.measure
  ) {
    chart.value.dispatchAction({
      type: 'dataZoom',
      dataZoomIndex: 0,
      startValue: timeseriesStore.timeRange[0],
      endValue: timeseriesStore.timeRange[1],
    });
  }
}

function makeSerie<S extends ScenarioData | SensorData>(s: S, getColor: (s: S) => string | undefined, lineStyle: {[key: string]: string }): SeriesOption {
  const timestamps = s.vectors.find(
    (col) => col.measure === 'timestamp',
  )?.values;
  const column = s.vectors.find((col) => col.measure === props.measure);
  let colData = column?.values;
  if (colData && props.precision) {
    colData = colData.map((d) =>
      typeof d === 'number' ? d.toFixed(props.precision) : d,
    );
  }
  return {
    name: s.name,
    showSymbol: false,
    animation: false,
    symbol: 'none',
    symbolSize: 0,
    colorBy: 'series',
    type: 'line',
    lineStyle: lineStyle,
    color: getColor(s) || '#000000',
    data: timestamps?.map((t, index) => [t, colData ? colData[index] : 0]) || [],
  };
}

function makeSensorsSeries(): SeriesOption[] {
  return sensors.value.map((s) => {
    return makeSerie(s, getSensorColor, {});
  });
}

function makeScenariiSeries(): SeriesOption[] {
  return scenarii.value
    .filter(scenario => scenario.data)
    .map((scenario) => {
      return makeSerie(scenario.data as ScenarioData, getScenarioColor, { type: 'dashed' });
    });
}

function buildOptions() {
  loading.value = true;

  const series = [...makeSensorsSeries(), ...makeScenariiSeries()];

  option.value = {
    renderer: 'canvas',
    animation: false,
    tooltip: {
      trigger: 'axis',
      triggerOn: 'click',
      appendTo: document.getElementById('tooltip-container') as HTMLElement,
      className: 'echarts-tooltip',
      enterable: true,
      axisPointer: {
        animation: false,
      },
      confine: true,
      valueFormatter: (value) => {
        if (value === null || value === undefined || value === '') return '-';
        if (typeof value === 'string') {
          return `${(Number.parseFloat(value).toFixed(2))} ${props.unit}`;
        }
        if (typeof value === 'number') {
          return `${value.toFixed(2)} ${props.unit}`;
        }
        return '?';
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
        disabled: !props.zoom,
      },
    ],
    grid: [
      {
        top: 5,
        left: 60,
        right: 10,
        bottom: 20,
      },
    ],
    xAxis: [
      {
        type: 'time',
        min: timeseriesStore.timeRange ? timeseriesStore.timeRange[0] : timeseriesStore.MIN_DATE,
        max: timeseriesStore.timeRange ? timeseriesStore.timeRange[1] : timeseriesStore.MAX_DATE,
        axisLabel: {
          hideOverlap: true,
          formatter: {
            month: '{monthStyle|{dd}/{MM}}',
            day: '{dd}/{MM}',
            hour: '{hourStyle|{HH}:{mm}}',
            minute: '{mm}',
          },
          rich: {
            monthStyle: {
              fontWeight: 'bolder',
            },
            hourStyle: {
              color: 'silver',
            },
          },
        },
      },
    ],
    yAxis: [
      {
        name:
          props.label !== props.unit
            ? props.label + ' (' + props.unit + ')'
            : props.label, // Add unit to label if different e.g pH doesn't need unit
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontWeight: 'bold',
        },
        type: 'value',
        nameTruncate: {
          maxWidth: 200,
          ellipsis: '...',
        },
        min: 'dataMin', // Automatically set the minimum value based on the data
        max: 'dataMax', // Automatically set the maximum value based on the data
      },
    ],
    series: series,
  };

  loading.value = false;
}

function updateOptions() {
  if (!chart.value) {
    return;
  }
  chart.value.setOption({
    series: [...makeSensorsSeries(), ...makeScenariiSeries()],
  }, { notMerge: false, replaceMerge: ['series'] }); // Preserve current zoom range
}

function getSensorColor(sensorData: SensorData) {
  const name = sensorData.name;
  const sensor = SensorSpecs.find((ss) => ss.locations.includes(name));
  if (!sensor) {
    return '#000000';
  }
  for (let i = 0; i < sensor?.locations.length; i++) {
    if (sensor?.locations[i] === name) {
      return sensor?.colors[i];
    }
  }
  return '#000000';
}

function getScenarioColor(scenarioData: ScenarioData) {
  return scenarioData.lineColor;
}
</script>
<style>
.echarts-tooltip {
  max-height: 200px;
  overflow-y: auto;
}
</style>
