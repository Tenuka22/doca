import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export type UserMode = "patient" | "guardian";

interface UserModeContextValue {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
}

const UserModeContext = createContext<UserModeContextValue | null>(null);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>("patient");

  const toggleMode = () => {
    setMode((prev) => (prev === "patient" ? "guardian" : "patient"));
  };

  return (
    <UserModeContext.Provider value={{ mode, setMode, toggleMode }}>
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
