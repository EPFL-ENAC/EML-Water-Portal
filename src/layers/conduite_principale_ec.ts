import { Map, Popup } from 'maplibre-gl';
import { FeatureCollection } from 'geojson';
import { LayerManager } from 'src/layers/models';
import { FilterParams } from 'src/stores/filters';
import { fileStoreUrl } from 'src/boot/api';

const GEOJSON_URL = `${fileStoreUrl}/geojson/conduite_principale_ec.geojson`;

export class ConduitePrincipaleECLayerManager extends LayerManager<FilterParams> {

  data: FeatureCollection | null = null;

  getId(): string {
    return 'conduite_principale_ec';
  }

  async append(map: Map): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('conduite_principale_ec', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'conduite_principale_ec',
      type: 'line',
      source: 'conduite_principale_ec',
      paint: {
        'line-opacity': 0.8,
        'line-color': 'red',
        'line-width': 5
      }
    });

    map.on('click', 'conduite_principale_ec', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'conduite_principale_ec', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'conduite_principale_ec', () => {
        map.getCanvas().style.cursor = '';
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    ['conduite_principale_ec'].forEach(id => {
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
