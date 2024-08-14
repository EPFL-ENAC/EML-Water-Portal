import { Map, MapGeoJSONFeature } from 'maplibre-gl';
import { Scenario } from 'src/stores/scenarii';

export abstract class LayerManager<T> {
  
  /**
   * Get the identifier of the managed layer.
   */
  abstract getId(): string;

  /**
   * Add the layer to the map.
   */
  abstract append(map: Map, selectionCallback: FeatureSelectionCallback): Promise<void>;

  /**
   * Set the visibility of the layer.
   */
  abstract setVisible(map: Map, visible: boolean): void;

  /**
   * Filter the layer.
   */
  abstract filter(map: Map, filter: T): void;

  /**
   * Apply the scenarii to the layer.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyScenarii(map: Map, scenarii: Scenario[]): void {
    return;
  }
 
}

export interface FeatureSelectionCallback {
  (name: string, feature: MapGeoJSONFeature): void
}