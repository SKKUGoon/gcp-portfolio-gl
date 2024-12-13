<script lang="ts">
  import { onMount } from "svelte";
  import { provideLayerContext, useLayerContext } from "$lib/stores/layerContext";
  import { secStore, thresholds } from "$lib/stores/secStore";
  import { GeoJsonLayer } from "deck.gl";
  import { MapboxOverlay } from "@deck.gl/mapbox";
  import RegionDetailCard from "$lib/components/RegionDetailCard.svelte";
  import { providePopupContext, usePopupContext } from "$lib/stores/popupContext";
  
  provideLayerContext();
  providePopupContext();

  let map: any; // Mapbox mapboxgl.Maps
  let lng: number, lat: number, zoom: number;

  let overlay: MapboxOverlay;
  let colorscale: (value: number) => [number, number, number, number];

  const { layers } = useLayerContext();
  const { displayPopup } = usePopupContext();

  function createFeatureCollection(data: { [key: string]: { type: string; coordinates: any[]; properties: any } }): { type: "FeatureCollection"; features: any[] } {
    const featureCollection: { type: "FeatureCollection"; features: any[] } = {
      type: "FeatureCollection",
      features: []
    };

    for (const key in data) {
      const feature = {
        type: "Feature",
        id: key,
        geometry: { type: data[key].type, coordinates: data[key].coordinates },
        properties: data[key].properties["disp"]  // Only show the `disp` property
      };
      featureCollection.features.push(feature); 
    }

    return featureCollection;
  }

  function createColorScale(values: [number, number]): (value: number) => [number, number, number, number] {
    // Calculate equal interval thresholds for 9 classes
    const [min, max] = values;
    const interval = (max - min) / 9;
    
    // Create array of 9 thresholds with equal intervals
    const thresholds = Array.from({length: 9}, (_, i) => min + interval * (i + 1));
    
    // Define distinct colors for each class
    const colors: [number, number, number, number][] = [
      [68, 1, 84, 40],       // Dark purple
      [70, 50, 127, 120],    // Purple  
      [54, 92, 141, 120],    // Blue-purple
      [39, 127, 142, 120],   // Blue-green
      [31, 161, 135, 120],   // Green
      [74, 193, 109, 120],   // Light green
      [159, 218, 58, 120],   // Yellow-green
      [222, 222, 36, 120],   // Yellow
      [253, 231, 37, 120]    // Bright yellow
    ];

    return (value: number) => {
      const classIndex = thresholds.findIndex(threshold => value <= threshold);
      // Return the color for this class, or the last color if above all thresholds
      return colors[classIndex === -1 ? colors.length - 1 : classIndex];
    };
  }

  function getPolygonCenter(coordinates: [number, number][] | [number, number][][]): [number, number] {
    // Handle MultiPolygon by flattening all points
    const allPoints = coordinates.flat().flat().reduce<[number, number][]>((acc, val, i, arr) => {
      if (i % 2 === 0) {
        acc.push([val, arr[i + 1]]);
      }
      return acc;
    }, []);
    
    // Calculate the center by averaging all x and y coordinates
    const center = allPoints.reduce(
      (acc, point: [number, number]) => {
        acc[0] += point[0];
        acc[1] += point[1];
        return acc;
      },
      [0, 0]
    );

    return [
      center[0] / allPoints.length,
      center[1] / allPoints.length
    ];
  }

  
  function displayLayer(layers: { [ layer: string ]: { called: boolean; data: any | null } }) {
    if (!overlay) return;
    // Drop any existing layers if no layers are active
    if (Object.keys(layers).length === 0) {
      overlay.setProps({ layers: [] });
    }
    
    let refreshDisplay = false;

    for (const dataLayer in layers) {
      if (layers[dataLayer].called) refreshDisplay = true;
    }

    if (refreshDisplay) {
      console.time("Reloading GL...");
      const featureCollection = createFeatureCollection($secStore);

      const geojsonLayer = new GeoJsonLayer({
        id: "geojson-layer",
        data: featureCollection,
        filled: true,
        stroked: true,
        getFillColor: d => {
          const value = d.properties;
          return colorscale(value);
        },
        getLineColor: [128, 128, 128, 50], // Made more transparent
        lineWidthMinPixels: 0.5, // Made thinner
        pickable: true,
        onClick: d => {
          displayPopup(d.object["id"]);

          map.flyTo({
            center: getPolygonCenter(d.object["geometry"]["coordinates"]),
            zoom: 15,
            essential: true
          });
        }
      });

      overlay.setProps({ layers: [geojsonLayer] });
      console.timeEnd("Reloading GL...")
    }
  }

  async function loadSecPolygonData() {
    try {
      // Fetch the polygon data
      const response = await fetch('/api/geo');
      if (!response.ok) {
        throw new Error('Failed to fetch polygon data');
      }
      const data: { tot_reg_cd: string; adm_nm: string; geometry: string }[] = await response.json();

      // Parse the polygon data
      const polygons: { [key: string]: { type: string; coordinates: any[]; properties: any } } = {};
      for (const poly of data) {
        const geojson = JSON.parse(poly.geometry);
        polygons[poly.tot_reg_cd] = { ...geojson, properties: {} };
      }

      secStore.set(polygons);
    } catch (error) {
      console.error(error);
    }
  }

  onMount(async () => {
    const { Map } = (await import("mapbox-gl")).default;

    map = new Map({
      container: 'map', // container ID
      style: import.meta.env.VITE_MAPBOX_STYLE,
      center: [126.93, 37.53], // starting position [lng, lat]
      zoom: 15,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
    });

    overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay);

    lat = map.getCenter().lat;
    lng = map.getCenter().lng;
    zoom = map.getZoom();

    // Load the polygon data
    loadSecPolygonData();

    // Subscribe to layer changes
    layers.subscribe((l) => {
      colorscale = createColorScale($thresholds);
      displayLayer(l);
    });
  });
</script>

<svelte:head>
  <link rel="stylesheet" href="/css/mapbox-gl.css" />
</svelte:head>

<div class="map" id="map" />
<RegionDetailCard />
<slot />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .map {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
