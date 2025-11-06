import { useCallback, useEffect, useRef, useState } from 'react';

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

interface Options<T> {
  serializer?: Serializer<T>;
  deserializer?: Deserializer<T>;
}

const isBrowser = typeof window !== 'undefined';

export const usePersistentState = <T,>(key: string, defaultValue: T, options?: Options<T>) => {
  const serializer = options?.serializer ?? JSON.stringify;
  const deserializer = options?.deserializer ?? JSON.parse;
  const initialized = useRef(false);

  const readValue = useCallback((): T => {
    if (!isBrowser) return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return deserializer(stored);
    } catch {
      return defaultValue;
    }
  }, [defaultValue, deserializer, key]);

  const [value, setValue] = useState<T>(() => readValue());

  useEffect(() => {
    if (!isBrowser) return;
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    try {
      window.localStorage.setItem(key, serializer(value));
    } catch {
      // ignore write errors
    }
  }, [value, key, serializer]);

  useEffect(() => {
    if (!isBrowser) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      setValue(readValue());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, readValue]);

  return [value, setValue] as const;
};
