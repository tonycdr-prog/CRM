import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ROUTES, isCompanionPath } from "@/lib/routes";

type ViewMode = "office" | "engineer";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  isEngineerMode: boolean;
  isOfficeMode: boolean;
  enterCompanionMode: (path?: string) => void;
  enterOfficeMode: (path?: string) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = "app-view-mode";

function isValidViewMode(value: string | null): value is ViewMode {
  return value === "office" || value === "engineer";
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidViewMode(stored)) {
        return stored;
      }
    }
    return "office";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => (prev === "office" ? "engineer" : "office"));
  }, []);

  const enterCompanionMode = useCallback((path?: string) => {
    setViewModeState("engineer");
    if (path && location !== path) {
      setLocation(path);
    }
  }, [location, setLocation]);

  const enterOfficeMode = useCallback((path?: string) => {
    setViewModeState("office");
    if (path && location !== path) {
      setLocation(path);
    }
  }, [location, setLocation]);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        isEngineerMode: viewMode === "engineer",
        isOfficeMode: viewMode === "office",
        enterCompanionMode,
        enterOfficeMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}

export function useRouteSync() {
  const { viewMode, setViewMode } = useViewMode();
  const [location] = useLocation();

  useEffect(() => {
    const isCompanion = isCompanionPath(location);
    
    if (isCompanion && viewMode !== "engineer") {
      setViewMode("engineer");
    } else if (!isCompanion && viewMode !== "office") {
      setViewMode("office");
    }
  }, [location, viewMode, setViewMode]);
}
