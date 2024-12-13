import { writable, type Writable } from "svelte/store";
import { setContext, getContext } from "svelte";
import { createLayerConfig, layerData } from "./layerSynthesis";
import { secStore, thresholds } from "./secStore";

const LAYER_CONTEXT_KEY = Symbol();

export function createLayerStore() {
  const layers: Writable<{
    [layer: string]: {
      called: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any | null; // Holds GeoJSON
    }
  }> = writable({});

  function createQueryParams(params: { [key: string]: string }) {
    const urlParams: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      urlParams.push(`${key}=${value}`);
    }
    return urlParams.join("&");
  }

  const addLayer = (layer: string) => {
    layers.update((layers) => {
      layers[layer] = {
        called: false,
        data: null,
      }
      return { ...layers };
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateLayer = (layer: string, data: any) => {
    const targetHour = 3;

    layers.update((layers) => {
      layers[layer].data = data;

      // Update the thresholds
      secStore.update((secStore) => {
        for (const secCd in secStore) {
          // If the layer data exists, update the secStore
          if (data[secCd]) secStore[secCd]["properties"][layer] = data[secCd][targetHour] ?? 0;

          // Update the disp value
          secStore[secCd]["properties"]["disp"] = Object
            .entries(secStore[secCd]["properties"])
            .filter(([key]) => key !== 'disp')
            .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
          
          // Update the threshold
          thresholds.update((thresholds) => {
            const [min, max] = thresholds;

            if (secStore[secCd]["properties"]["disp"] < min) thresholds[0] = secStore[secCd]["properties"]["disp"];
            if (secStore[secCd]["properties"]["disp"] > max) thresholds[1] = secStore[secCd]["properties"]["disp"];

            return thresholds;
          });
        }
        return secStore;
      });

      layers[layer].called = true;
      return { ...layers };
    })
  }

  const removeLayer = (layer: string) => {
    layers.update((layers) => {
      if (layers[layer]) {
        delete layers[layer];
      }

      secStore.update((secStore) => {
        for (const secCd in secStore) {
          delete secStore[secCd]["properties"][layer];
          secStore[secCd]["properties"]["disp"] = Object
            .entries(secStore[secCd]["properties"])
            .filter(([key]) => key !== 'disp')
            .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
        }
        return secStore;
      });

      // Reset the threshold
      thresholds.update(() => [Infinity, -Infinity]);

      secStore.update((secStore) => {
        for (const secCd in secStore) {
          // Update the threshold
          thresholds.update((thresholds) => {
            const [min, max] = thresholds;

            if (secStore[secCd]["properties"]["disp"] < min) thresholds[0] = secStore[secCd]["properties"]["disp"];
            if (secStore[secCd]["properties"]["disp"] > max) thresholds[1] = secStore[secCd]["properties"]["disp"];

            return thresholds;
          });
        }
        return secStore;
      })

      return { ...layers };
    })
  }

  const clearLayers = () => {
    layers.set({});
  }

  layers.subscribe(async (layers) => {
    const pendingLayers = Object.keys(layers).filter((layer) => !layers[layer].called);

    if (pendingLayers.length > 0) {
      for (const l of pendingLayers) {
        try {
          const layerConfig = createLayerConfig(l);
          const queryParams = createQueryParams(layerConfig.param);

          const response = await fetch(`/api/${layerConfig.endpoint}?${queryParams}`, { method: "GET" });
          if (response.ok) {
            const rawData = await response.json();
            const data = layerData(rawData);
            updateLayer(l, data);
          } else {
            console.error("API call failed", layerConfig, queryParams);
          }
        } catch (error) {
          console.error("Error making API call: ", error);
        }
      }
    }
  })

  return { layers, addLayer, updateLayer, removeLayer, clearLayers };
}

export function provideLayerContext() {
  const store = createLayerStore();
  setContext(LAYER_CONTEXT_KEY, store); // Provide the store to the context
}

export function useLayerContext(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  layers: Writable<{ [ layer: string ]: { called: boolean; data: any | null } }>;
  addLayer: (layer: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateLayer: (layer: string, data: any) => void;
  removeLayer: (layer: string) => void;
  clearLayers: () => void;
} {
  return getContext(LAYER_CONTEXT_KEY); // Get the store from the context
}