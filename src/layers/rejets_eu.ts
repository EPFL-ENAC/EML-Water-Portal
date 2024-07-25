import { Map, Popup } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/rejets_eu.geojson`;

export class RejetsEULayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'rejets_eu';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('rejets_eu', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'rejets_eu',
      type: 'circle',
      source: 'rejets_eu',
      paint: {
        'circle-opacity': 0.8,
        'circle-radius': 10,
        'circle-color': '#a52a2a',
        'circle-stroke-color': 'black',
        'circle-stroke-width': 1
      },
      layout: {
        visibility: 'none'
      }
    });

    map.on('click', 'rejets_eu', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'rejets_eu', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'rejets_eu', () => {
        map.getCanvas().style.cursor = '';
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['rejets_eu'].forEach(id => {
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