import api from './client';
import type { FuelLogEntry, FuelLogCreate } from '../types/fuel';

export const getFuelLogs = (carId: number, signal?: AbortSignal): Promise<FuelLogEntry[]> =>
  api.get<FuelLogEntry[]>(`/modules/fuel/cars/${carId}`, { signal }).then((r) => r.data);

export const createFuelLog = (carId: number, body: FuelLogCreate): Promise<FuelLogEntry> =>
  api.post<FuelLogEntry>(`/modules/fuel/cars/${carId}`, body).then((r) => r.data);

export const deleteFuelLog = (id: number): Promise<void> =>
  api.delete(`/modules/fuel/${id}`).then(() => undefined);
