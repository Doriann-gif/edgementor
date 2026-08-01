import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import type { Mentor } from "@/types/mentor";
import { MAX_COMPARE } from "@/lib/compare";

const STORAGE_KEY = "edgementor:compare";

interface CompareContextValue {
  selected: Mentor[];
  isSelected: (id: string) => boolean;
  /** Add if room + not present, remove if present. Returns what happened so
   *  callers can surface the right toast (e.g. "list is full"). */
  toggle: (mentor: Mentor) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
  canAddMore: boolean;
  count: number;
  max: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const loadInitial = (): Mentor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Guard against a corrupted / outdated payload.
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
};

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<Mentor[]>(loadInitial);
  const [open, setOpen] = useState(false);

  // Persist the tray so a selection survives navigation and reloads.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch {
      /* storage full / unavailable — comparison still works in-memory */
    }
  }, [selected]);

  const isSelected = useCallback((id: string) => selected.some((m) => m.id === id), [selected]);

  const toggle = useCallback<CompareContextValue["toggle"]>((mentor) => {
    let result: "added" | "removed" | "full" = "added";
    setSelected((prev) => {
      if (prev.some((m) => m.id === mentor.id)) {
        result = "removed";
        return prev.filter((m) => m.id !== mentor.id);
      }
      if (prev.length >= MAX_COMPARE) {
        result = "full";
        return prev;
      }
      result = "added";
      return [...prev, mentor];
    });
    return result;
  }, []);

  const remove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
    setOpen(false);
  }, []);

  const value = useMemo<CompareContextValue>(() => ({
    selected,
    isSelected,
    toggle,
    remove,
    clear,
    canAddMore: selected.length < MAX_COMPARE,
    count: selected.length,
    max: MAX_COMPARE,
    open,
    setOpen,
  }), [selected, isSelected, toggle, remove, clear, open]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
};
