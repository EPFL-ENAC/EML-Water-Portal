<template>
  <div class="q-pa-xl">
    <div class="slider-container">
      <q-btn class="play-button" @click="togglePlay" flat>{{
        playing ? 'Pause' : 'Play'
      }}</q-btn>
    </div>
    <div id="slider-round" ref="sliderHTML" class="slider-styled" />
  </div>
</template>

<script setup lang="ts">
import noUiSlider from 'nouislider';
import { PipsMode, type API as SliderAPI } from 'nouislider';
import 'nouislider/dist/nouislider.css';
import { defineModel, onUnmounted, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  min: Date;
  max: Date;
  step?: number;
}>();

const slider = ref<SliderAPI | null>(null);
const sliderHTML = ref<HTMLDivElement | null>(null);
const testValue = defineModel<[Date, Date]>({ required: true });
const playing = ref(false);
let playInterval: NodeJS.Timeout | undefined;

const defaultStep = 60 * 60 * 1000; //step is hour

const updateSlider = () => {
  if (slider.value) {
    slider.value.destroy(); // Destroy existing slider instance
  }

  if (sliderHTML.value) {
    const minMs = props.min.getTime();
    const maxMs = props.max.getTime();

    console.log(minMs, maxMs);
    slider.value = noUiSlider.create(sliderHTML.value, {
      start: [minMs, maxMs],
      tooltips: [formatterTooltip, formatterTooltip],
      connect: true,
      behaviour: 'drag',
      step: props.step || defaultStep,
      range: {
        min: minMs,
        max: maxMs,
      },
      pips: {
        mode: PipsMode.Steps,
        filter: filterPips,
        density: 100, // Reduced density for better performance
        format: formatter,
      },
    });
    slider.value.on('update', (values) => {
      testValue.value = values.map((val) => new Date(Number(val))) as [
        Date,
        Date,
      ];
    });
  }
};

const play = () => {
  if (!slider.value || playing.value) return;
  playing.value = true;
  const [min, max] = (slider.value.get() as [string, string]).map(Number);
  if (max === props.max.getTime()) {
    const range = max - min;
    slider.value.set([props.min.getTime(), props.min.getTime() + range]);
  }
  playInterval = setInterval(() => {
    if (slider.value) {
      const current = (slider.value.get() as [string, string]).map(Number);
      if (current[1] >= props.max.getTime()) {
        stop();
      } else {
        slider.value.set([
          current[0] + (props.step || defaultStep * 12),
          current[1] + (props.step || defaultStep * 12),
        ]);
      }
    }
  }, 200); // Adjusted interval to reduce frequent updates
};

const stop = () => {
  playing.value = false;
  if (playInterval) clearInterval(playInterval);
};

const togglePlay = () => {
  if (playing.value) stop();
  else play();
};

onUnmounted(() => {
  if (playInterval) clearInterval(playInterval);
});

watch(
  () => [props.min, props.max, props.step],
  () => {
    updateSlider();
  },
  { deep: true },
);

onMounted(() => {
  updateSlider();
});
const formatter = {
  to: (value: number) => {
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    return `${day}/${month}`;
  },
  from: (value: string) => {
    const [day, month] = value.split('/').map(Number);
    const year = new Date().getFullYear(); // Use the current year
    return new Date(year, month - 1, day).getTime();
  },
};

const formatterTooltip = {
  to: (value: number) => {
    const date = new Date(value);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  },
  from: (value: string) => {
    const [datePart, timePart] = value.split(' ');
    const [day, month] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const year = new Date().getFullYear(); // Use the current year
    return new Date(year, month - 1, day, hours, minutes).getTime();
  },
};

const filterPips = (value: number) => {
  const date = new Date(value);
  const day = date.getUTCDate();
  const weekDay = date.getUTCDay();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  if (day === 1 && hours === 0 && minutes === 0 && seconds === 0) {
    return 1; // First of the month
  } else if (weekDay === 0 && hours === 0 && minutes === 0 && seconds === 0) {
    return 2; // First day of the week (Sunday)
  } else if (hours === 0 && minutes === 0 && seconds === 0) {
    return 0; // Start of the day
  } else {
    return -1; // Hide pip
  }
};
</script>
<style scoped>
.slider-container {
  position: relative;
}

.play-button {
  position: absolute;
  top: -35px;
  right: 0; /* Aligns the button to the top-right corner */
  margin: 0; /* Adjust margin as needed */
}

.slider-styled {
  position: relative;
  width: 100%; /* Ensures the slider expands to fill the container */
  height: 10px;
  padding: 0 7px;
}

.drag-icon {
  position: relative;
}

:deep() .noUi-value {
  padding-top: 3px;
}
:deep() .noUi-value-large {
  padding-top: 8px;
}

:deep() .noUi-value-sub {
  padding-top: 2px;
}

:deep() .slider-styled {
  height: 10px;
  padding: 0 7px;
}

:deep() .noUi-handle:before,
:deep() .noUi-handle:after {
  display: none;
}

:deep() .slider-styled .noUi-connect {
  background: var(--q-primary);
}

:deep() .slider-styled .noUi-handle {
  height: 18px;
  width: 18px;
  top: -5px;
  right: -9px; /* half the width */
  border-radius: 9px;
}

:deep() .noUi-touch-area {
  height: 250%;
  width: 250%;
  cursor: col-resize;
  z-index: 1000;
}

:deep() .noUi-handle-lower .noUi-touch-area {
  transform: translate(-50%, -25%);
}
:deep() .noUi-handle-upper .noUi-touch-area {
  transform: translate(0, -25%);
}
:deep() .noUi-pips {
  color: var(--q-dark);
}
:deep() .noUi-tooltip {
  display: none;
}
:deep() .noUi-active .noUi-tooltip {
  display: block;
}
</style>
