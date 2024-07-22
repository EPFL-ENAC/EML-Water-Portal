import { Map } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';

const GEOJSON_URL = 'https://enacit4r-cdn.epfl.ch/water-portal/2024-07-22T16:51/geojson/river.geojson';

export class RiverLayerManager extends LayerManager<FilterParams> {

  riverData: FeatureCollection | null = null;

  getId(): string {
    return 'river';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.riverData = await response.json() as FeatureCollection;

    map.addSource('river', {
      type: 'geojson',
      data: this.riverData
    });
;

    map.addLayer({
      id: 'river',
      type: 'line',
      source: 'river',
      paint: {
        'line-opacity': 0.8,
        'line-color': '#33C9EB',
        'line-width': 3
      }
    });

  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['river'].forEach(id => {
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
