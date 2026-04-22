import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getModules } from '../api/modules';
import type { ModuleInfo } from '../types/module';

interface ModulesContextValue {
  modules: ModuleInfo[];
  refresh: () => void;
}

const ModulesContext = createContext<ModulesContextValue>({ modules: [], refresh: () => {} });

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);

  const refresh = useCallback(() => {
    getModules().then(setModules).catch(() => setModules([]));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ModulesContext.Provider value={{ modules, refresh }}>
      {children}
    </ModulesContext.Provider>
  );
}

export const useModules = () => useContext(ModulesContext);
