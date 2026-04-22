import api from './client';
import type { FusePanel, FusePanelSummary } from '../types/fuses';

export const getFusePanels = (signal?: AbortSignal): Promise<FusePanelSummary[]> =>
  api.get<FusePanelSummary[]>('/modules/fuses/', { signal }).then((r) => r.data);

export const getFusePanel = (key: string, signal?: AbortSignal): Promise<FusePanel> =>
  api.get<FusePanel>(`/modules/fuses/${key}`, { signal }).then((r) => r.data);
