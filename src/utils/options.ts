export const MeasureOptions = [
  { key: 'water_level', label: 'Water level', unit: 'm', precision: 3 },
  {
    key: 'water_temperature',
    label: 'Water Temperature',
    unit: '°C',
    precision: 2,
  },
  { key: 'water_samples', label: 'Water Samples', unit: '', precision: 2 },

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
    title: 'Multiparameter sensor',
    device: 'In-Situ',
    measures: [
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
    title: 'Temperature sensor',
    device: 'Ruskin',
    measures: ['water_temperature'],
  },
  {
    color: '#51bbd6',
    label: 'C',
    title: 'Water level/discharge sensor',
    device: 'Ijinus',
    measures: ['water_level'],
  },
  {
    color: '#fc8449',
    label: 'D',
    title: 'Water samples to analyse in the lab',
    device: 'Autosampler ISCO',
    measures: ['water_samples'],
  },
];
