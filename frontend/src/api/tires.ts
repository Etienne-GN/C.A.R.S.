import api from './client';
import type { TireSet, TireSetCreate, TireSetUpdate, TreadReadingCreate } from '../types/tires';

export const getTireSets = (carId: number, signal?: AbortSignal): Promise<TireSet[]> =>
  api.get<TireSet[]>(`/modules/tires/cars/${carId}`, { signal }).then((r) => r.data);

export const createTireSet = (carId: number, body: TireSetCreate): Promise<TireSet> =>
  api.post<TireSet>(`/modules/tires/cars/${carId}`, body).then((r) => r.data);

export const updateTireSet = (id: number, body: TireSetUpdate): Promise<TireSet> =>
  api.patch<TireSet>(`/modules/tires/${id}`, body).then((r) => r.data);

export const deleteTireSet = (id: number): Promise<void> =>
  api.delete(`/modules/tires/${id}`).then(() => undefined);

export const addTreadReading = (setId: number, body: TreadReadingCreate): Promise<void> =>
  api.post(`/modules/tires/${setId}/readings`, body).then(() => undefined);

export const deleteTreadReading = (readingId: number): Promise<void> =>
  api.delete(`/modules/tires/readings/${readingId}`).then(() => undefined);
