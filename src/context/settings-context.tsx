import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createApiClient } from "@/lib/api";
import { getItem, setItem } from "@/lib/storage";

import type { KyInstance } from "ky";

export type SavedChannel = {
  id: string;
  name: string;
};

type SettingsContextValue = {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
  channels: SavedChannel[];
  addChannel: (channel: SavedChannel) => void;
  removeChannel: (id: string) => void;
  apiClient: KyInstance | null;
  isLoaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEYS = {
  baseUrl: "settings:baseUrl",
  proxyUrl: "settings:proxyUrl",
  channels: "settings:channels",
} as const;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState("http://192.168.1.73:8888");
  const [proxyUrl, setProxyUrlState] = useState("http://192.168.1.73:3002");
  const [channels, setChannels] = useState<SavedChannel[]>([
    {
      id: "UCKpOpDFWOZQ2QXjDkVU3WTQ",
      name: "Overflow",
    },
    {
      id: "UCsBjURrPoezykLs9EqgamOA",
      name: "Fireship",
    },
  ]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedUrl, storedProxyUrl, storedChannels] = await Promise.all([
        getItem<string>(STORAGE_KEYS.baseUrl),
        getItem<string>(STORAGE_KEYS.proxyUrl),
        getItem<SavedChannel[]>(STORAGE_KEYS.channels),
      ]);
      if (storedUrl) setBaseUrlState(storedUrl);
      if (storedProxyUrl) setProxyUrlState(storedProxyUrl);
      if (storedChannels) setChannels(storedChannels);
      setIsLoaded(true);
    })();
  }, []);

  const setBaseUrl = useCallback((url: string) => {
    const trimmed = url.trim().replace(/\/+$/, "");
    setBaseUrlState(trimmed);
    setItem(STORAGE_KEYS.baseUrl, trimmed);
  }, []);

  const setProxyUrl = useCallback((url: string) => {
    const trimmed = url.trim().replace(/\/+$/, "");
    setProxyUrlState(trimmed);
    setItem(STORAGE_KEYS.proxyUrl, trimmed);
  }, []);

  const addChannel = useCallback((channel: SavedChannel) => {
    setChannels((prev) => {
      if (prev.some((c) => c.id === channel.id)) return prev;
      const next = [...prev, channel];
      setItem(STORAGE_KEYS.channels, next);
      return next;
    });
  }, []);

  const removeChannel = useCallback((id: string) => {
    setChannels((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setItem(STORAGE_KEYS.channels, next);
      return next;
    });
  }, []);

  const apiClient = useMemo(
    () => (baseUrl ? createApiClient(baseUrl) : null),
    [baseUrl],
  );

  const value = useMemo(
    () => ({
      baseUrl,
      setBaseUrl,
      proxyUrl,
      setProxyUrl,
      channels,
      addChannel,
      removeChannel,
      apiClient,
      isLoaded,
    }),
    [
      baseUrl,
      setBaseUrl,
      proxyUrl,
      setProxyUrl,
      channels,
      addChannel,
      removeChannel,
      apiClient,
      isLoaded,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
