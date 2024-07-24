export interface Column {
  name: string;
  measure: string;
  format?: string;
  data?: (number | string)[]
}

export interface SensorData {
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
  sensors: SensorData[];
}

export interface Dataset {
  file: string;
  header: string[];
  data: string[][];
}

