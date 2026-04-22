import api from './client';
import type { ModuleInfo } from '../types/module';

export const getModules = (signal?: AbortSignal): Promise<ModuleInfo[]> =>
  api.get<ModuleInfo[]>('/modules/', { signal }).then((r) => r.data);

export const updateModule = (key: string, is_enabled: boolean): Promise<ModuleInfo> =>
  api.patch<ModuleInfo>(`/modules/${key}`, { is_enabled }).then((r) => r.data);
