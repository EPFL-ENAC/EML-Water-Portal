import { Map } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager, FeatureSelectionCallback } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/bv.geojson`;

export class BVLayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'bv';
  }

  async append(map: Map, selectionCallback: FeatureSelectionCallback): Promise<void> {
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
        'fill-color': '#00a79f',
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
      }
    });

    map.on('click', 'bv', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      selectionCallback(this.getId(), feature);
      // TODO highlight the feature as being selected
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
