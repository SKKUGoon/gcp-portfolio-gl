import { writable, type Writable } from "svelte/store";
import { setContext, getContext } from "svelte";
const POPUP_CONTEXT_KEY = Symbol();

export function createPopupContext() {
  const popup: Writable<{
    isVisible: boolean;
    id: string | null;
    dataLoaded: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feature: any | null;
  }> = writable({
    isVisible: false,
    id: null,
    dataLoaded: false,
    feature: null
  });

  function displayPopup(regionId: string) {
    popup.set({
      isVisible: true,
      id: regionId,
      dataLoaded: false,
      feature: null
    });
  }

  function parseDataObject(data: {date_str: string; hour: number; sec_code: string; data: number}[]) {
    const dataSet: { [key: string]: number } = {};
    for (const d of data) {
      dataSet[d.hour] = d.data ? d.data : 0;
    }
    return dataSet;
  }

  async function loadData(regionId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataSet: { [key: string]: any } = {};
    
    // Get Chinese - Long
    const response_long = await fetch(`/api/foreign?secCode=${regionId}&isChinese=true&isLong=true`);
    const data_long = await response_long.json();
    dataSet["Chinese(Long)"] = parseDataObject(data_long);
    
    // Get Chinese - Short
    const response_short = await fetch(`/api/foreign?secCode=${regionId}&isChinese=true&isLong=false`);
    const data_short = await response_short.json();
    dataSet["Chinese(Short)"] = parseDataObject(data_short);

    // Get Non-Chinese - Long
    const response_long_non = await fetch(`/api/foreign?secCode=${regionId}&isChinese=false&isLong=true`);
    const data_long_non = await response_long_non.json();
    dataSet["Non Chinese(Long)"] = parseDataObject(data_long_non);

    // Get Non-Chinese - Short
    const response_short_non = await fetch(`/api/foreign?secCode=${regionId}&isChinese=false&isLong=false`);
    const data_short_non = await response_short_non.json();
    dataSet["Non Chinese(Short)"] = parseDataObject(data_short_non);

    // Get Local - Total
    const response_local = await fetch(`/api/local?secCode=${regionId}`);
    const data_local = await response_local.json();
    dataSet["Local"] = parseDataObject(data_local);

    popup.set({
      isVisible: true,
      id: regionId,
      dataLoaded: true,
      feature: dataSet
    });
  }

  function closePopup() {
    popup.set({
      isVisible: false,
      id: null,
      dataLoaded: false,
      feature: null
    });
  }

  popup.subscribe(async (popup) => {
    if (popup.isVisible && !popup.dataLoaded && popup.id) {
      await loadData(popup.id);
    }
  })

  return { popup, displayPopup, closePopup };
}

export function providePopupContext() {
  const store = createPopupContext();
  setContext(POPUP_CONTEXT_KEY, store);
}

export function usePopupContext(): {
  popup: Writable<{
    isVisible: boolean;
    id: string | null;
    dataLoaded: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feature: any | null;
  }>;
  displayPopup: (regionId: string) => void;
  closePopup: () => void;
} {
  return getContext(POPUP_CONTEXT_KEY);
}