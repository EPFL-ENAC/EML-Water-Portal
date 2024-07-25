import { Map, Popup } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/meteo.geojson`;

export class MeteoLayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'meteo';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('meteo', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'meteo',
      type: 'circle',
      source: 'meteo',
      paint: {
        'circle-opacity': 0.8,
        'circle-radius': 10,
        'circle-color': 'yellow',
        'circle-stroke-color': 'orange',
        'circle-stroke-width': 1
      },
      layout: {
        visibility: 'none'
      }
    });

    map.on('click', 'meteo', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'meteo', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'meteo', () => {
        map.getCanvas().style.cursor = '';
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['meteo'].forEach(id => {
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