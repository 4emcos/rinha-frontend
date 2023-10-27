export const fingLargeArray = (
  jsonData: any,
  x: number,
  actualKey = ""
): string[] => {
  const foundedKeys: string[] = [];

  if (Array.isArray(jsonData) && jsonData.length > x) {
    foundedKeys.push(actualKey);
  } else if (typeof jsonData === "object") {
    for (const key in jsonData) {
      if (jsonData.hasOwnProperty(key)) {
        const newKey = actualKey ? [actualKey, key].join(",") : key;
        const foundedKeysChildren = fingLargeArray(jsonData[key], x, newKey);
        foundedKeys.push(...foundedKeysChildren);
      }
    }
  }

  return foundedKeys;
};
