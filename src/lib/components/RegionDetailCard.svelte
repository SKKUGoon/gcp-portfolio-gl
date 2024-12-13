<script lang="ts">
  import { usePopupContext } from '$lib/stores/popupContext';
  import { onMount } from 'svelte';
  import Chart from "chart.js/auto";

  const { popup, closePopup } = usePopupContext();

  let chartCanvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function getSerialColor(index: number) {
    const colors = [
      '#36A2EB', // blue
      '#FF6384', // red
      '#4BC0C0', // teal
      '#FF9F40', // orange
      '#9966FF'  // purple
    ];
    return colors[index % colors.length];
  }

  function processChartData(feature: any) {
    // Get all layer keys (except id, type, etc.)
    const layers = Object.keys(feature).filter(key => 
      typeof feature[key] === 'object' && feature[key] !== null
    );

    // Create datasets for each region
    const datasets = layers.map((layer, index) => ({
      label: layer,
      data: Array.from({ length: 24 }, (_, hour) => feature[layer][hour]),
      borderColor: getSerialColor(index),
      backgroundColor: 'transparent',
      tension: 0.4,
      borderWidth: 2
    }));

    return datasets;
  }

  $: if ($popup.isVisible && $popup.feature && chartCanvas) {
    if (chart) chart.destroy();
    
    const datasets = processChartData($popup.feature);
    
    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'white',
              font: {
                size: 12
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white'
            }
          }
        }
      }
    });
  }

  onMount(() => {
    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

{#if $popup.isVisible}
  <div class="card">
    <button class="close-btn" on:click={closePopup}>&times;</button>
    <h3>Region Details</h3>
    <div class="content">
      <div class="chart-container">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    background-color: #1c1c1c;
    margin-bottom: 0.25%;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    opacity: 0.85;
    min-width: 700px;
    z-index: 1000;
  }

  .close-btn {
    position: absolute;
    right: 8px;
    top: 8px;
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
  }

  h3 {
    font-weight: 600;
    margin: 0 0 16px 0;
    text-align: center;
  }

  .content {
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .chart-container {
    width: 750px;
    height: 300px;
    margin: 10px 0;
  }
</style>
