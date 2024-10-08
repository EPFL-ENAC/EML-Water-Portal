import { Datasets } from 'src/models';
import { fileStoreUrl } from 'src/boot/api';
import Papa from 'papaparse';
import { parse, format } from 'date-fns';

const TIMESERIES_URL = `${fileStoreUrl}/timeseries`;
const DATASETS_URL = `${TIMESERIES_URL}/datasets.json`;
const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

interface PapaResults {
  data: string[][];
}

export const useMeasuresStore = defineStore('measures', () => {
  const datasets = ref<Datasets>();
  const loading = ref(false);

  async function loadDatasets() {
    if (datasets.value) return Promise.resolve();

    loading.value = true;
    const response = await fetch(DATASETS_URL);
    datasets.value = await response.json();

    let loaded = 0;
    datasets.value?.files.forEach((dataset) => {
      const url = `${TIMESERIES_URL}/${dataset.file}`;
      Papa.parse(url, {
        download: true,
        delimiter: dataset.separator,
        skipEmptyLines: true,
        //skipFirstNLines: dataset.skip, // FIXME skip does not work
        //header: true,
        complete: function (results: PapaResults) {
          const header = results.data[dataset.skip];
          const rows = results.data.splice(dataset.skip + 1);
          // foreach dataset sensor based on this file, turn rows into columns
          populateSensorData(dataset.file, header, rows);
          loaded++;
          if (loaded === datasets.value?.files.length) {
            loading.value = false;
          }
        },
      });
    });
  }

  function populateSensorData(
    file: string,
    header: string[],
    rows: string[][],
  ) {
    datasets.value?.sensors
      .filter((sensor) => sensor.file === file)
      .forEach((sensor) => {
        sensor.columns.forEach((col) => {
          const idx = header.indexOf(col.name);
          if (idx < 0) {
            console.error(`Column ${col.name} not found in ${file}`);
          } else {
            const vector = rows
              .map((row) => row[idx])
              .map((val: string) => {
                if (col.measure === 'timestamp') {
                  // parse with date-fns if different from target format
                  const sanitized = val.replaceAll('\n', '').trim();
                  try {
                    return col.format && col.format !== DATETIME_FORMAT
                      ? format(
                          parse(sanitized, col.format, new Date()),
                          DATETIME_FORMAT,
                        )
                      : sanitized;
                  } catch (err) {
                    console.error(err);
                    return sanitized;
                  }
                } else {
                  // only numbers
                  try {
                    // Replace comma with dot
                    const sanitized = val ? val
                      .replaceAll(',', '.')
                      .replaceAll('\n', '')
                      .replaceAll(' ', '') : '0';
                    // Parse the float
                    return parseFloat(sanitized);
                  } catch (err) {
                    console.error(err);
                    return -1;
                  }
                }
              });
            col.data = vector;
          }
        });
      });
  }

  return {
    loading,
    datasets,
    loadDatasets,
  };
});
