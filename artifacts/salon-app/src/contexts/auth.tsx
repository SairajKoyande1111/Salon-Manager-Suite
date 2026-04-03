import { createContext, useContext, useState, ReactNode } from "react";

export type LockConfig = {
  pin: string;
  modules: string[];
};

type AuthContextType = {
  unlockedModules: Set<string>;
  unlockModule: (path: string) => void;
  lockConfig: LockConfig;
  saveLockConfig: (cfg: LockConfig) => void;
  getCredentials: () => { email: string; password: string };
  saveCredentials: (email: string, password: string) => void;
};

const DEFAULT_CREDS = { email: "thetouch@gmail.com", password: "thetouch@132231" };
const DEFAULT_LOCKS: LockConfig = { pin: "", modules: [] };

export function getStoredCredentials() {
  try {
    const raw = localStorage.getItem("atsalon_creds");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CREDS;
}

export function getStoredLocks(): LockConfig {
  try {
    const raw = localStorage.getItem("atsalon_locks");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_LOCKS;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [unlockedModules, setUnlockedModules] = useState<Set<string>>(new Set());
  const [lockConfig, setLockConfig] = useState<LockConfig>(() => getStoredLocks());

  const unlockModule = (path: string) => {
    setUnlockedModules(prev => new Set([...prev, path]));
  };

  const saveLockConfig = (cfg: LockConfig) => {
    localStorage.setItem("atsalon_locks", JSON.stringify(cfg));
    setLockConfig(cfg);
    setUnlockedModules(new Set());
  };

  const getCredentials = () => getStoredCredentials();

  const saveCredentials = (email: string, password: string) => {
    localStorage.setItem("atsalon_creds", JSON.stringify({ email, password }));
  };

  return (
    <AuthContext.Provider value={{ unlockedModules, unlockModule, lockConfig, saveLockConfig, getCredentials, saveCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
