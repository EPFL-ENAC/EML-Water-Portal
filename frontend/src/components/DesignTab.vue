<template>
  <div style="height: 400px;">
    <div ref="historicalChartContainer" style="height: 250px;"></div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
import { ref, onMounted, computed, watch } from 'vue'
import * as echarts from 'echarts'
import { getSensorFamilyColorGradient } from 'src/utils/options'

const historicalData = computed(() =>
  useMeasuresStore().sensors.filter((s) => s.name === "10_years")[0]?.vectors || []
)
const HISTORICAL_DATA_POINT_COUNT = 500

const historicalChartContainer = ref(null)
let historicalChart: echarts.ECharts | null = null

const historicalChartData = computed(() => {
  const timestamps = historicalData.value.filter(d => d.measure === "timestamp")[0]?.values || [];
  const precipitation = historicalData.value.filter(d => d.measure === "precipitation")[0]?.values || [];
  if (timestamps.length === 0 || precipitation.length === 0) {
    return [];
  }
  const points = []
  for (let i = 0; i < HISTORICAL_DATA_POINT_COUNT; i++) {
    const index = Math.floor((timestamps.length - 1) * (i / (HISTORICAL_DATA_POINT_COUNT - 1)));
    points.push([
      new Date(timestamps[index] as string),
      Math.floor(precipitation[index] as number * 100) / 100
    ]);
  }
  return points
})

const historicalChartOptions = computed(() => ({
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    top: 15,
    left: 60,
    right: 10,
    bottom: 30,
  },
  xAxis: {
    type: 'time',
    splitLine: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    name: `${t('Precipitation')} (mm)`,
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

onMounted(() => {
  if (historicalChartContainer.value) {
    historicalChart = echarts.init(historicalChartContainer.value)
    historicalChart.setOption(historicalChartOptions.value)

    // Handle window resize
    window.addEventListener('resize', () => {
      historicalChart?.resize()
    })
  }
})

// Watch for data changes and update chart
watch(historicalChartOptions, (newOptions) => {
  if (historicalChart) {
    historicalChart.setOption(newOptions, true)
  }
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
  if (historicalChart) {
    historicalChart.dispose()
  }
  window.removeEventListener('resize', () => {
    historicalChart?.resize()
  })
})
</script>
