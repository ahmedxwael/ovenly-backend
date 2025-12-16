import { GenericObject } from "@/types";

export const only = <T extends GenericObject, K extends keyof T>(
  obj: T,
  keys: K[]
): Record<K, T[K]> => {
  const result = Object.entries(obj)
    .filter(([key]) => keys.includes(key as K))
    .reduce(
      (acc, [key, value]) => {
        acc[key as K] = value as T[K];
        return acc;
      },
      {} as Record<K, T[K]>
    );

  return result;
};
