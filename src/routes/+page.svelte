<script>
  import LayerSelector from "$lib/components/LayerSelector.svelte";
  import { useLayerContext } from "$lib/stores/layerContext";
  import { secStore, thresholds } from "$lib/stores/secStore";
  
  // Update here to change the layers
  const layerGroups = {
    localMale: {
      name: 'Local Male',
      layerGroup: 'local.Male',
      layers: ['0-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+']
    },
    localFemale: {
      name: 'Local Female',
      layerGroup: 'local.Female',
      layers: ['0-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+']
    },
    foreigner: {
      name: 'Foreigner',
      layerGroup: 'foreign',
      layers: ['Chinese(Long)', 'Non Chinese(Long)', 'Chinese(Short)', 'Non Chinese(Short)']
    },
    analysis: {
      name: 'Analysis',
      layerGroup: 'analysis',
      layers: ['Daytime Activity', 'Nighttime Activity'],
    }
  }

  const d = $thresholds;

  function test() {
    console.log($layers);
    console.log($secStore);

    const uniqueValues = [...new Set(d)].sort((a, b) => a - b);
    
    // Calculate equal interval thresholds for 9 classes
    const min = uniqueValues[0];
    const max = uniqueValues[uniqueValues.length - 1];
    const interval = (max - min) / 9;
    
    // Create array of 9 thresholds with equal intervals
    const colorThreshold = Array.from({length: 9}, (_, i) => min + interval * (i + 1));
    console.log(colorThreshold);
  }

  const { layers } = useLayerContext();
</script>

<LayerSelector layerGroups={layerGroups} />
<button 
  on:click={test} 
  style="position: absolute; top: 500px; left: 20px"
>
  Test
</button>

<style>
    /* Global font */
  :global(body) {
    font-family: 'Poppins', sans-serif;
  }
</style>