import { Map } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';

const GEOJSON_URL = 'https://enacit4r-cdn.epfl.ch/water-portal/2024-07-22T16:51/geojson/bv.geojson';

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
      }
    });
    
    map.addLayer({
      id: 'bv-outline',
      type: 'line',
      source: 'bv',
      paint: {
        'line-opacity': 0.8,
        'line-color': '#346EEB',
        'line-width': 3
      }
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

  filter(map: Map, filter: FilterParams): void {
    // filter by stationName ?
    return;
  }

}
