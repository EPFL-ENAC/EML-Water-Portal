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
  // {
  //   key: 'water_samples',
  //   label: 'Water Samples',
  //   unit: '',
  //   precision: 2,
  // },
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
  // {
  //   key: 'air_temperature',
  //   label: 'Air Temperature',
  //   unit: '°C',
  //   precision: 2,
  // },
];

export const SensorColors = [
  {
    color: '#9400D3',
    label: 'A',
    layer: 'sensors-a',
    title: 'Multiparameter sensor',
    device: 'In-Situ',
    locations: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
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
    locations: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15'],
    measures: ['water_temperature'],
  },
  {
    color: '#51bbd6',
    label: 'C',
    layer: 'sensors-c',
    title: 'Water level/discharge sensor',
    device: 'Ijinus',
    locations: ['C1', 'C2'],
    measures: ['water_level'],
  },
  {
    color: '#fc8449',
    label: 'D',
    layer: 'sensors-d',
    title: 'Water samples to analyse in the lab',
    device: 'Autosampler ISCO',
    locations: ['D1', 'D2', 'D3', 'D4'],
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
      colors = [
        '#ff0000',
        '#ffad5c',
        '#fff720',
        '#3be06d',
        '#1bffff',
        '#2e4fc6',
      ];
      break;
    default:
      colors = ['#62cff4', '#2c67f2'];
  }
  const gradient = new Gradient();

  if (colors.length === 2) gradient.setColorGradient(colors[0], colors[1]);
  else
    gradient.setColorGradient(
      colors[0],
      colors[1],
      colors[2],
      colors[3],
      colors[4],
      colors[5],
    );

  gradient.setMidpoint(Math.max(colors.length, midpoints));
  return gradient.getColors();
}
