"use client";

// Catalog context, loaded once, shared across the storefront, with reload support

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CatalogDTO } from "@/lib/als/types";
import { api } from "@/lib/als/api";

type CatalogCtx = {
  catalog: CatalogDTO | null;
  error: string | null;
  reload: () => Promise<void>;
  content: (key: string) => string;
};

const Ctx = createContext<CatalogCtx>({ catalog: null, error: null, reload: async () => {}, content: () => "" });

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const data = await api<CatalogDTO>("/api/catalog");
      setCatalog(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the store.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const content = useCallback(
    (key: string) => catalog?.content?.[key] ?? "",
    [catalog]
  );

  return <Ctx.Provider value={{ catalog, error, reload, content }}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  return useContext(Ctx);
}
