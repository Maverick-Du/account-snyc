//@ts-nocheck
export function camel(data) {
  if (typeof data != "object" || !data) return data;
  if (Array.isArray(data)) {
    return data.map((item) => camel(item));
  }

  const newData = {};
  for (let key in data) {
    let newKey = key.replace(/_([a-z])/g, (p, m) => m.toUpperCase());
    newData[newKey] = camel(data[key]);
  }
  return newData;
}

export function getEnumKeyByValue(enumObj, value): string | undefined {
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
}
