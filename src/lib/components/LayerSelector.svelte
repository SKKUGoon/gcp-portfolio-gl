<script lang="ts">
  import { useLayerContext } from "$lib/stores/layerContext";
  import { onMount } from "svelte";

  type LayerGroup = { [key: string]: { name: string; layerGroup: string; layers: string[] } };
  export let layerGroups: LayerGroup;

  // Get the context for layer selection
  const { layers, addLayer, removeLayer } = useLayerContext();

  // Toggle layer selection
  function toggleLayer(layer: string) {
    if ($layers[layer]) {
      removeLayer(layer);
    } else {
      // Add layer to the context
      addLayer(layer);
    }
  }

  // Dynamic component size
  let isMinimized = false;
  let windowWidth = 0; // Initialize windowWidth before the browser is initialized
  const THRESHOLD_WIDTH = 850; // Minimize the component if the window width is smaller than a threshold

  function handleResize() {
    if (isBrowser) {
      windowWidth = window.innerWidth;

      if (windowWidth < THRESHOLD_WIDTH) {
        isMinimized = true;
      } else {
        isMinimized = false;
      }
    }
  }

  let isBrowser = false;
  onMount(() => {
    // Safely initialize browser independent variables
    isBrowser = true;

    // Ensure this only runs in the browser
    windowWidth = window.innerWidth;
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  })
</script>

<div class="layer-selector {isMinimized ? 'minimized' : ''}">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="header" on:click={() => (isMinimized = !isMinimized)}>
    <h3>Data Layer Selection</h3>
    <button class="toggle-button">{isMinimized ? '+' : '-'}</button>
  </div>
  
  {#if !isMinimized}
    <div class="layer-group">
      {#each Object.values(layerGroups) as layerGroup}
        <p>{layerGroup.name}</p>
        {#each layerGroup.layers as layer}
          <button
            class="layer-button {Object.keys($layers).includes(layerGroup.layerGroup + '+' + layer) ? 'selected' : ''}"
            on:click={() => toggleLayer(layerGroup.layerGroup + '+' +layer)}
          >
            {layer}
          </button>
        {/each}
      {/each}
    </div>
  {/if}
</div>
  
<style>
  .layer-selector {
    position: absolute;
    top: 20px;
    left: 20px;
    background-color: #1c1c1c; /* Dark background */
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    opacity: 0.85;
    width: 850px;
    z-index: 1000;
  }

  .layer-selector.minimized {
    width: 200px; /* Smaller width when minimized */
    height: auto;
    overflow: hidden;
    padding: 10px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  .toggle-button {
    background-color: transparent;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
  }

  .layer-group {
    margin-bottom: 16px;
  }

  .layer-button {
    display: inline-block;
    padding: 5px 8px;
    margin: 2px;
    border: 2px solid #444; /* Default border */
    border-radius: 6px;
    background-color: #2d2d2d; /* Default dark background */
    color: white;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .layer-button:hover {
    background-color: #3d3d3d; /* Slightly lighter on hover */
    border-color: #666;
  }

  .layer-button.selected {
    background-color: #092b50; /* Active/Selected state */
    border-color: #0056b3;
    color: white;
  }

  .layer-button.selected:hover {
    background-color: #0056b3; /* Slightly darker on hover */
    border-color: #003d80;
  }

  h3 {
    font-weight: 600;
    margin-bottom: 16px;
  }

  p {
    font-weight: 500;
    margin-bottom: 8px;
  }
</style>