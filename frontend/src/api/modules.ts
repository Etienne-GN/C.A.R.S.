import api from './client';
import type { ModuleInfo } from '../types/module';

export const getModules = (signal?: AbortSignal): Promise<ModuleInfo[]> =>
  api.get<ModuleInfo[]>('/modules/', { signal }).then((r) => r.data);
