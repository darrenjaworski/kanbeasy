import { useEffect, useState } from "react";
import { kvGetBool, kvSet, kvSetBool } from "../utils/db";

/**
 * Syncs a boolean setting to the key-value store.
 * Reads the initial value from the store on mount; persists on every change.
 */
export function useStoredBool(
  key: string,
  defaultValue: boolean,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [value, setValue] = useState(() => kvGetBool(key, defaultValue));
  useEffect(() => {
    kvSetBool(key, value);
  }, [key, value]);
  return [value, setValue];
}

/**
 * Syncs a string setting to the key-value store.
 * Accepts an init function to allow validation/migration of the stored value.
 * Persists on every change.
 */
export function useStoredString<T extends string>(
  key: string,
  init: () => T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(init);
  useEffect(() => {
    kvSet(key, value);
  }, [key, value]);
  return [value, setValue];
}
