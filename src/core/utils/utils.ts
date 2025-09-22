function transformKeys<T extends object>(
  obj: T,
  transformer: (key: string) => string,
): T {
  return Object.keys(obj).reduce((acc, key) => {
    const newKey = transformer(key);
    acc[newKey] = obj[key];
    return acc;
  }, {} as T);
}
