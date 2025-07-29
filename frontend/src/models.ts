export interface Column {
  name: string;
  measure: string;
  format?: string;
  data?: (number | string)[];
}

export interface SensorDataSpec {
  name: string;
  file: string;
  columns: Column[];
}

export interface DatasetFile {
  file: string;
  skip: number;
  separator: string;
}

export interface Datasets {
  files: DatasetFile[];
  sensors: SensorDataSpec[];
}

export interface Dataset {
  file: string;
  header: string[];
  data: string[][];
}

export interface Vector {
  measure: string;
  values: (string | null)[] | (number | null)[];
}

export interface SensorData {
  name: string;
  vectors: Vector[];
}

export interface ScenarioData {
  name: string;
  vectors: Vector[];
  lineColor: string;
}

export interface SensorInfo {
  sensor: string
  site_name: string
  model: string
  site_description: { en: string; fr: string }
}

export interface DesignCurve {
  x: number[];
  y: number[];
  label: string;
}

export interface DesignData {
  tank_volume: DesignCurve[];
  runoff_coefficient: DesignCurve[];
  failure_rate: DesignCurve[];
}
