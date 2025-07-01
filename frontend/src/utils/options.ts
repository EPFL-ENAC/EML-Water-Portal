import Gradient from 'javascript-color-gradient';

export const DateRangeOptions = computed(() => {
  return [
    { value: '1d', label: 'past_1d' },
    { value: '3d', label: 'past_3d' },
    { value: '7d', label: 'past_7d' },
    { value: '30d', label: 'past_30d' },
    { value: 'custom', label: 'custom_time_range' },
  ]
});

export interface MeasureOption {
  key: string;
  unit: string;
  precision: number;
  is_scenario_measure: boolean;
}

export const MeasureOptions: MeasureOption[] = [
  {
    key: 'precipitation',
    unit: 'mm/5min',
    precision: 0,
    is_scenario_measure: false,
  },
  {
    key: 'water_level',
    unit: 'mm',
    precision: 0,
    is_scenario_measure: false,
  },
  {
    key: 'depth',
    unit: 'm',
    precision: 3,
    is_scenario_measure: false,
  },
  {
    key: 'water_temperature',
    unit: '°C',
    precision: 2,
    is_scenario_measure: false,
  },
  // {
  //   key: 'water_samples',
  //   unit: '',
  //   precision: 2,
  //   is_scenario_measure: false,
  // },
  {
    key: 'electro_conductivity',
    unit: 'µs/cm',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'dissolved_oxygen',
    unit: 'mg/L',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'ph',
    unit: 'pH',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'turbidity',
    unit: 'NTU',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'oxidation_reduction_potential',
    unit: 'V',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'fdom',
    unit: 'RFU',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'nitrate',
    unit: 'mg/L',
    precision: 2,
    is_scenario_measure: false,
  },
  {
    key: 'outflow_total',
    unit: 'L/s',
    precision: 1,
    is_scenario_measure: true,
  },
  {
    key: 'outflow_tank',
    unit: 'L/s',
    precision: 1,
    is_scenario_measure: true,
  },
  {
    key: 'soil_moisture',
    unit: '-',
    precision: 4,
    is_scenario_measure: true,
  },
  {
    key: 'volume_tank',
    unit: 'm³',
    precision: 2,
    is_scenario_measure: true,
  },
];

const gradientA = getSensorFamilyColorGradient('A', 6);
const gradientAUnil = getSensorFamilyColorGradient('A_Unil', 4);
const gradientB = getSensorFamilyColorGradient('B', 15);
const gradientC = getSensorFamilyColorGradient('C', 3);

export const SensorSpecs = [
  {
    color: gradientA[2],
    label: 'A',
    layer: 'sensors-a',
    title: {
      en: 'Multi-parameters sensors',
      fr: 'Capteurs multi-paramétriques',
    },
    device: 'In-Situ',
    icon: 'opacity',
    locations: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
    colors: gradientA,
    measures: [
      'water_temperature',
      'depth',
      'electro_conductivity',
      'turbidity',
      'dissolved_oxygen',
      'ph',
      'oxidation_reduction_potential',
    ],
  },
  {
    color: gradientAUnil[1],
    label: 'A_Unil',
    layer: 'sensors-a_unil',
    title: {
      en: 'Multi-parameters sensors (Unil)',
      fr: 'Capteurs multi-paramétriques (Unil)',
    },
    device: 'In-Situ',
    icon: 'opacity',
    locations: ['A_Unil1', 'A_Unil2', 'A_Unil3', 'A_Unil4'],
    colors: gradientAUnil,
    measures: [
      'water_temperature',
      'electro_conductivity',
      'turbidity',
      'fdom',
      'nitrate',
    ],
  },
  {
    color: gradientB[8],
    label: 'B',
    layer: 'sensors-b',
    title: {
      en: 'Temperature sensors',
      fr: 'Capteurs de température',
    },
    device: 'Ruskin',
    icon: 'thermostat',
    locations: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15'],
    colors: gradientB,
    measures: ['water_temperature'],
  },
  {
    color: gradientC[1],
    label: 'C',
    layer: 'sensors-c',
    title: {
      en: 'Water level and rain sensors',
      fr: 'Capteurs de niveau d\'eau et de pluie',},
    device: 'Ijinus',
    icon: 'podcasts',
    locations: ['C1', 'C2','C3'],
    colors: gradientC,
    measures: ['precipitation', 'water_level'],
  },
];

export function getSensorFamilyColorGradient(name: string, midpoints: number) {
  let colors: string[] = [];
  switch (name) {
    case 'A':
      colors = ['#0d0887','#6a00a8','#b12a90','#e16462','#fca636','#f0f921'].reverse(); // plasma
      break;
    case 'A_Unil':
      colors = ['#002051','#575c6e','#a49d78','#fdea45'].reverse(); // cividis
      break;
    case 'B':
      colors = ['#92ffc0', '#002661'];
      break;
    default:
      colors = ['#62cff4', '#2c67f2'];
  }
  const gradient = new Gradient();

  if (colors.length === 2)
    gradient.setColorGradient(...colors.slice(0, 2));
  else if (colors.length === 4)
    gradient.setColorGradient(...colors.slice(0, 4));
  else
    gradient.setColorGradient(...colors.slice(0, 6));

  gradient.setMidpoint(Math.max(colors.length, midpoints));
  return gradient.getColors().reverse();
}
