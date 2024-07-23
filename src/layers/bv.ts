import { Map, Popup } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/bv.geojson`;

export class BVLayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'bv';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('bv', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'bv',
      type: 'fill',
      source: 'bv',
      paint: {
        'fill-opacity': 0.5,
        'fill-color': '#33C9EB',
      },
      layout: {
        visibility: 'none'
      }
    });
    
    map.addLayer({
      id: 'bv-outline',
      type: 'line',
      source: 'bv',
      paint: {
        'line-opacity': 0.8,
        'line-color': '#346EEB',
        'line-width': 1
      },
      layout: {
        visibility: 'none'
      }
    });

    map.on('click', 'bv', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'bv', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'bv', () => {
        map.getCanvas().style.cursor = '';
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['bv', 'bv-outline'].forEach(id => {
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
