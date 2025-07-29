<template>
  <div>
    <div ref="historicalChartContainer" style="height: 200px;"></div>
    <div ref="tankVolumeChartContainer" style="height: 300px;"></div>
    <div ref="failureRateChartContainer" style="height: 300px;"></div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
import { ref, onMounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { getSensorFamilyColorGradient } from 'src/utils/options'

const HISTORICAL_DATA_POINT_COUNT = 500
const DEFAULT_WATERSHED = "swisstech01"

const props = defineProps({
  watershed: {
    type: String,
    default: "swisstech01"
  }
})

const historicalChartContainer = ref(null)
const tankVolumeChartContainer = ref(null)
const failureRateChartContainer = ref(null)
let historicalChart: echarts.ECharts | null = null
let tankVolumeChart: echarts.ECharts | null = null
let failureRateChart: echarts.ECharts | null = null

const historicalData = computed(() =>
  useMeasuresStore().sensors.filter((s) => s.name === "10_years")[0]?.vectors || []
)

const designData = computed(() =>
  useDesignStore().designData || []
)

const historicalChartData = computed(() => {
  const timestamps = historicalData.value.filter(d => d.measure === "timestamp")[0]?.values || [];
  const precipitation = historicalData.value.filter(d => d.measure === "precipitation")[0]?.values || [];
  if (timestamps.length === 0 || precipitation.length === 0) {
    return [];
  }
  const points = []
  for (let i = 0; i < HISTORICAL_DATA_POINT_COUNT; i++) {
    const index = Math.floor((timestamps.length - 1) * (i / (HISTORICAL_DATA_POINT_COUNT - 1)));
    const value = precipitation[index];
    points.push([
      new Date(timestamps[index] as string),
      typeof value === 'number' ? value.toFixed(2) : value
    ]);
  }
  return points
})

const tankVolumeChartSeries = computed(() => {
  let watershed = props.watershed;
  if (!(watershed in designData.value)) {
    watershed = DEFAULT_WATERSHED;
  }

  const designCurves = designData.value[watershed]?.tank_volume || [];
  return designCurves.map((design_curve, index) => ({
    name: design_curve.label,
    type: 'line',
    smooth: false,
    symbol: 'none',
    lineStyle: {
      color: getSensorFamilyColorGradient('design_tank_volume', designCurves.length)[index],
      width: 2
    },
    data: design_curve.x.map((x, i) => [
      x,
      design_curve.y[i]
    ])
  }));
})

const failureRateChartSeries = computed(() => {
  let watershed = props.watershed;
  if (!(watershed in designData.value)) {
    watershed = DEFAULT_WATERSHED;
  }

  const designCurves = designData.value[watershed]?.failure_rate || [];
  return designCurves.map((design_curve, index) => ({
    name: design_curve.label,
    type: 'line',
    smooth: false,
    symbol: 'none',
    lineStyle: {
      color: getSensorFamilyColorGradient('design_failure_rate', designCurves.length)[index],
      width: 2
    },
    data: design_curve.x.map((x, i) => [
      x,
      design_curve.y[i]
    ])
  }));
})

const chartGrid = {
  top: 15,
  left: 60,
  right: 20,
  bottom: 40,
}

const historicalChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: chartGrid,
  xAxis: {
    type: 'time',
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    name: `${t('measure.precipitation.axis_label')} (mm)`,
    nameLocation: 'middle',
    nameGap: 40,
    nameTextStyle: {
      fontWeight: 'bold',
    },
    splitLine: {
      lineStyle: {
        type: 'solid'
      }
    }
  },
  series: [{
    name: 'Sensor Data',
    type: 'line',
    smooth: false,
    symbol: 'none',
    lineStyle: {
      color: getSensorFamilyColorGradient('C', 3)[1],
      width: 2
    },
    data: historicalChartData.value
  }]
}))

const tankVolumeChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: chartGrid,
  xAxis: {
    type: 'value',
    name: `${t('Roof runoff')} (-)`,
    nameLocation: 'middle',
    nameGap: 25,
    nameTextStyle: {
      fontWeight: 'bold',
    },
    axisLabel: {
      formatter: "{value}%"
    },
    splitLine: {
      show: true
    }
  },
  yAxis: {
    type: 'value',
    name: `${t('Tank volume')} (m³)`,
    nameLocation: 'middle',
    nameGap: 40,
    nameTextStyle: {
      fontWeight: 'bold',
    },
    splitLine: {
      lineStyle: {
        type: 'solid'
      }
    }
  },
  series: tankVolumeChartSeries.value
}))

const failureRateChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: chartGrid,
  xAxis: {
    type: 'value',
    name: `${t('Tank volume')} (m³)`,
    nameLocation: 'middle',
    nameGap: 25,
    nameTextStyle: {
      fontWeight: 'bold',
    },
    splitLine: {
      show: true
    }
  },
  yAxis: {
    type: 'value',
    name: `${t('Failure rate')} (-)`,
    nameLocation: 'middle',
    nameGap: 40,
    nameTextStyle: {
      fontWeight: 'bold',
    },
    axisLabel: {
      formatter: "{value}%"
    },
    splitLine: {
      lineStyle: {
        type: 'solid'
      }
    }
  },
  series: failureRateChartSeries.value
}))

const handleResize = () => {
  historicalChart?.resize()
  tankVolumeChart?.resize()
  failureRateChart?.resize()
}

onMounted(() => {
  if (historicalChartContainer.value) {
    historicalChart = echarts.init(historicalChartContainer.value)
    historicalChart.setOption(historicalChartOptions.value)
  }

  if (tankVolumeChartContainer.value) {
    tankVolumeChart = echarts.init(tankVolumeChartContainer.value)
    tankVolumeChart.setOption(tankVolumeChartOptions.value)
  }

  if (failureRateChartContainer.value) {
    failureRateChart = echarts.init(failureRateChartContainer.value)
    failureRateChart.setOption(failureRateChartOptions.value)
  }

  window.addEventListener('resize', handleResize)
})

watch([historicalChartData], () => {
  if (historicalChart) {
    historicalChart.setOption(historicalChartOptions.value, true)
  }
}, { deep: true })

onUnmounted(() => {
  if (historicalChart) {
    historicalChart.dispose()
  }
  if (tankVolumeChart) {
    tankVolumeChart.dispose()
  }
  if (failureRateChart) {
    failureRateChart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>
