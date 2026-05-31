import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { getItemAsync, setItemAsync } from "expo-secure-store";
import { Platform } from "react-native";

export type UserMode = "patient" | "guardian";

const MODE_STORAGE_KEY = "user_mode";

interface UserModeContextValue {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
}

const UserModeContext = createContext<UserModeContextValue | null>(null);

function isWeb(): boolean {
  return Platform.OS === "web";
}

async function loadMode(): Promise<UserMode> {
  if (isWeb()) {
    return (sessionStorage.getItem(MODE_STORAGE_KEY) as UserMode) ?? "patient";
  }
  try {
    const stored = await getItemAsync(MODE_STORAGE_KEY);
    if (stored === "patient" || stored === "guardian") {
      return stored;
    }
  } catch {
    /* ignore */
  }
  return "patient";
}

async function saveMode(mode: UserMode): Promise<void> {
  if (isWeb()) {
    sessionStorage.setItem(MODE_STORAGE_KEY, mode);
    return;
  }
  await setItemAsync(MODE_STORAGE_KEY, mode);
}

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>("patient");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadMode().then((stored) => {
      setMode(stored);
      setLoaded(true);
    });
  }, []);

  const persistAndSetMode = (newMode: UserMode) => {
    setMode(newMode);
    saveMode(newMode);
  };

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "patient" ? "guardian" : "patient";
      saveMode(next);
      return next;
    });
  };

  if (!loaded) {
    return null;
  }

  return (
    <UserModeContext.Provider
      value={{ mode, setMode: persistAndSetMode, toggleMode }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode(): UserModeContextValue {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error("useUserMode must be used within a UserModeProvider");
  }
  return context;
}
