import Gradient from 'javascript-color-gradient';

export const MeasureOptions = [
  {
    key: 'water_level',
    label: 'Water level',
    unit: 'mm',
    precision: 0,
  },
  {
    key: 'depth',
    label: 'Depth',
    unit: 'm',
    precision: 3,
  },
  {
    key: 'water_temperature',
    label: 'Water Temperature',
    unit: '°C',
    precision: 2,
  },
  {
    key: 'water_samples',
    label: 'Water Samples',
    unit: '',
    precision: 2,
  },
  {
    key: 'electro_conductivity',
    label: 'Electrical conductivity',
    unit: 'µs/cm',
    precision: 2,
  },
  {
    key: 'dissolved_oxygen',
    label: 'Dissolved oxygen',
    unit: 'mg/L',
    precision: 2,
  },
  { key: 'ph', label: 'pH', unit: 'pH', precision: 2 },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', precision: 2 },
  {
    key: 'oxidation_reduction_potential',
    label: 'Oxidation-reduction potential',
    unit: 'mV',
    precision: 2,
  },
  {
    key: 'air_temperature',
    label: 'Air Temperature',
    unit: '°C',
    precision: 2,
  },
];

export const SensorColors = [
  {
    color: '#9400D3',
    label: 'A',
    layer: 'sensors-a',
    title: 'Multiparameter sensor',
    device: 'In-Situ',
    measures: [
      'water_temperature',
      'depth',
      'air_temperature',
      'electro_conductivity',
      'turbidity',
      'dissolved_oxygen',
      'ph',
      'oxidation_reduction_potential',
    ],
  },
  {
    color: '#3FD400',
    label: 'B',
    layer: 'sensors-b',
    title: 'Temperature sensor',
    device: 'Ruskin',
    measures: ['water_temperature'],
  },
  {
    color: '#51bbd6',
    label: 'C',
    layer: 'sensors-c',
    title: 'Water level/discharge sensor',
    device: 'Ijinus',
    measures: ['water_level'],
  },
  {
    color: '#fc8449',
    label: 'D',
    layer: 'sensors-d',
    title: 'Water samples to analyse in the lab',
    device: 'Autosampler ISCO',
    measures: ['water_samples'],
  },
];

export function getColorGradient(measure: string, midpoints: number) {
  let colors = [];
  switch (measure) {
    case 'depth':
      colors = ['#A67B5B', '#000000'];
      break;
    case 'water_temperature':
    case 'air_temperature':
      colors = ['#ff0000', '#0095ff'];
      break;
    case 'electro_conductivity':
      colors = ['#f7ef07', '#de4313'];
      break;
    case 'ph':
      colors = ['#92ffc0', '#002661'];
      break;
    case 'turbidity':
      colors = ['#FFE4C4', '#A65B60'];
      break;
    case 'oxidation_reduction_potential':
      colors = ['#2e4fc6', '#1bffff', '#3be06d', '#fff720', '#ffad5c', '#ff0000'];
      break;
    default:
      colors = ['#62cff4', '#2c67f2'];
  }
  const gradient = new Gradient();

  if (colors.length === 2)
    gradient.setColorGradient(colors[0], colors[1]);
  else
    gradient.setColorGradient(colors[0], colors[1], colors[2], colors[3], colors[4], colors[5]);

  gradient.setMidpoint(Math.max(colors.length, midpoints));
  return gradient.getColors();
}
