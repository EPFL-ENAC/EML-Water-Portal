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

  async append(map: Map, selectionCallback: FeatureSelectionCallback): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;

    map.addSource('sensors', {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: 'sensors',
      source: 'sensors',
      type: 'circle',
      paint: {
        'circle-opacity': 0.8,
        'circle-radius': [
          'step',
          ['zoom'],
          2,   // Radius at zoom levels below 10
          10, 5,   // Radius at zoom level 10 and above
          15, 10  // Radius at zoom level 15 and above
        ],
        'circle-color': [
                'case',
                ['==', ['index-of', 'A', ['get', 'name']], 0], '#9400D3', // color if name starts with 'A'
                ['==', ['index-of', 'B', ['get', 'name']], 0], '#3FD400', // color if name starts with 'B'
                '#51bbd6' // color for all other categories
            ],
        'circle-stroke-color': 'black',
        'circle-stroke-width': 1
      },
    });

    // Create a popup, but don't add it to the map yet.
    const popup = new Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('click', 'sensors', (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      selectionCallback(this.getId(), feature);
      // TODO highlight the feature as being selected
    });

    map.on('mouseenter', 'sensors', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const feature = e.features ? e.features[0] : null;
        if (!feature) return;

        const measuresHtml = feature.properties.measures.split('|').map((val: string) => `<li>${val}</li>`).join('');

        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<table>
              <tbody>
              <tr>
                <td class="text-bold">Name</td>
                <td class="text-caption">${feature.properties.name}</td>
              </tr>
              <tr>
                <td class="text-bold">Sensor</td>
                <td class="text-caption">${feature.properties.sensor}</td>
              </tr>
              <tr>
                <td class="text-bold">Measures</td>
                <td class="text-caption"><ul>${measuresHtml}</ul></td>
              </tr>
              </tbody>
            </table>`
            //`<pre>${JSON.stringify(feature.properties, null, 2)}</pre>`
          )
          .addTo(map);
    });
    map.on('mouseleave', 'sensors', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
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
