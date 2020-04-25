export default function <T, K extends keyof T>(
  objectArray: T[],
  property: K,
): { [key: string]: T[] } {
  return objectArray.reduce((accumulator: Record<string, T[]>, obj) => {
    const key = (obj[property] as unknown) as string;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    if (typeof accumulator[key] === 'object') {
      (accumulator[key] as T[]).push(obj);
    }
    return accumulator;
  }, {});
}
