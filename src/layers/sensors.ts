import { Map, Popup } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/sensors.geojson`;

export class SensorsLayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'sensors';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('sensors', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'sensors',
      type: 'circle',
      source: 'sensors',
      paint: {
        'circle-opacity': 0.8,
        'circle-radius': 10,
        'circle-color': '#9400D3',
        'circle-stroke-color': 'black',
        'circle-stroke-width': 1
      }
    });

    map.on('click', 'sensors', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'sensors', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'sensors', () => {
        map.getCanvas().style.cursor = '';
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['sensors'].forEach(id => {
      map.setLayoutProperty(
        id,
        'visibility',
        visibility
      )
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filter(map: Map, filter: FilterParams): void {
    // filter by stationName ?
    return;
  }

}
