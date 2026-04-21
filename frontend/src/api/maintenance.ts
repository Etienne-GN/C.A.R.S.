import api from './client';
import type { ScheduledMaintenance, ScheduledMaintenanceCreate, ScheduledMaintenanceUpdate } from '../types/maintenance';

export const getMaintenance = (carId: number, signal?: AbortSignal): Promise<ScheduledMaintenance[]> =>
  api.get<ScheduledMaintenance[]>(`/cars/${carId}/maintenance/`, { signal }).then((r) => r.data);

export const createMaintenance = (carId: number, item: ScheduledMaintenanceCreate): Promise<ScheduledMaintenance> =>
  api.post<ScheduledMaintenance>(`/cars/${carId}/maintenance/`, item).then((r) => r.data);

export const updateMaintenance = (itemId: number, item: ScheduledMaintenanceUpdate): Promise<ScheduledMaintenance> =>
  api.patch<ScheduledMaintenance>(`/maintenance/${itemId}`, item).then((r) => r.data);

export const deleteMaintenance = (itemId: number): Promise<void> =>
  api.delete(`/maintenance/${itemId}`).then(() => undefined);
