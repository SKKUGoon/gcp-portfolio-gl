export function createLayerConfig(layer: string) {
  const [layerGroup, layerName] = layer.split("+");
  const [apiEndpoint, additionalInfo] = layerGroup.split(".");

  let endpoint: string = "";
  const param: { [key: string]: string } = {};

  switch (apiEndpoint) {
    case "local":
      endpoint = "local";
      param.gender = additionalInfo;
      param.age = layerName;
      break;
    case "foreign":
      endpoint = "foreign";
      param.isChinese = layerName.includes("Non Chinese") ? "false" : "true";
      param.isLong = layerName.includes("(Long)") ? "true" : "false";
      break;
    case "analysis":
      endpoint = "analysis";
      // Not implemented yet
      break;
  }

  return { endpoint, param };
}

export function layerData(
    rawData: { date_str: string; hour: number; sec_code: string; data: number | string }[],
) {
  const result: { [secCode: string]: { [hour: number]: number } } = {};
  for (const d of rawData) {
    const { hour, sec_code, data } = d;
    if (!result[sec_code]) {
      result[sec_code] = {};
    }
    result[sec_code][hour] = +data; // + Convert to number if not number
  }

  return result;
}
