import { Map, Popup, GeoJSONSource } from 'maplibre-gl';
import { Feature, FeatureCollection, GeoJSON, GeoJsonProperties, Geometry } from 'geojson';
import { LayerManager, FeatureSelectionCallback } from 'src/layers/models';
import { fileStoreUrl } from 'src/boot/api';
import { State } from 'src/layers/models';

const GEOJSON_URL = `${fileStoreUrl}/geojson/sensors.geojson`;

export class SensorsLayerManager extends LayerManager {

  family = ''; // A, B or C

  data: FeatureCollection | null = null;

  constructor(family: string) {
    super();
    this.family = family;
  }

  getId(): string {
    return `sensors-${this.family.toLowerCase()}`;
  }

  async append(map: Map, selectionCallback: FeatureSelectionCallback): Promise<void> {
    const response = await fetch(GEOJSON_URL);
    this.data = await response.json() as FeatureCollection;
    this.data.features = this.data.features.filter((feature: Feature<Geometry, GeoJsonProperties>) => {
      return feature.properties?.name.startsWith(this.family);
    });

    map.addSource(this.getId(), {
      type: 'geojson',
      data: this.data
    });

    map.addLayer({
      id: this.getId(),
      source: this.getId(),
      type: 'circle',
      paint: {
        'circle-opacity': [
          'case',
          ['get', 'selected'], 1,
          0.2
        ],
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

    map.addLayer({
      id: `${this.getId()}-labels`,
      type: 'symbol',
      source: this.getId(),
      layout: {
        'text-font': ['Roboto'],
        'text-field': ['get', 'name'], // Get the 'name' property from each feature
        'text-size': 14, // Text size
        'text-anchor': 'top', // Anchor text at the top of the point
        'text-offset': [0, 0.5] // Offset text slightly so it doesn't overlap the point
      },
      paint: {
        'text-color': '#000000', // Text color
        'text-halo-color': '#FFFFFF', // Halo color around text for better readability
        'text-halo-width': 2 // Width of the halo around the text
      }
    });

    // Create a popup, but don't add it to the map yet.
    const popup = new Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('click', this.getId(), (e) => {
      const feature = e.features ? e.features[0] : null;
      if (!feature) return;
      selectionCallback(this.getId(), feature);
      // TODO highlight the feature as being selected
    });

    map.on('mouseenter', this.getId(), (e) => {
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
    map.on('mouseleave', this.getId(), () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
  }

  setVisible(map: Map, visible: boolean): void {
    const visibility = visible ? 'visible' : 'none';
    [this.getId(), `${this.getId()}-labels`].forEach(id => {
      map.setLayoutProperty(
        id,
        'visibility',
        visibility
      )
    });
  }

  applyState(map: Map, state: State): void {
    if (!this.data) return;
    const updatedFeatures = this.data.features.map((feature: Feature<Geometry, GeoJsonProperties>) => {
      const selected = state.sensors.length === 0 || state.sensors.includes(feature.properties?.name);
      const updatedProperties = {
        ...feature.properties,
        selected
      }
      return {
        ...feature,
        properties: updatedProperties
      };
    });
    const updatedData = {
      ...this.data,
      features: updatedFeatures
    } as GeoJSON;
    (map.getSource(this.getId()) as GeoJSONSource).setData(updatedData);
  }


}
