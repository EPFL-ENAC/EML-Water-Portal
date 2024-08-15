export const MeasureOptions = [
  { key: 'water_level', label: 'Water level' },
  { key: 'water_temperature', label: 'Water Temperature' },
  { key: 'electro_conductivity', label: 'Electrical conductivity' },
  { key: 'dissolved_oxygen', label: 'Dissolved oxygen' },
  { key: 'ph', label: 'pH' },
  { key: 'turbidity', label: 'Turbidity' },
  {
    key: 'oxidation_reduction_potential',
    label: 'Oxidation-reduction potential',
  },
  { key: 'air_temperature', label: 'Air Temperature' },
];

export const SensorColors = [
  {
    color: '#9400D3',
    label: 'A',
    title: 'Multiparameter sensor',
    device: 'In-Situ',
    measures: ['air_temperature', 'electro_conductivity', 'turbidity', 'dissolved_oxygen', 'ph', 'oxidation_reduction_potential']
  },  
  {
    color: '#3FD400',
    label: 'B',
    title: 'Temperature sensor',
    device: 'Ruskin',
    measures: ['water_temperature']
  },
  {
    color: '#51bbd6',
    label: 'C',
    title: 'Water level/discharge sensor',
    device: 'Ijinus',
    measures: ['water_level']
  }
];