import api from './client';
import type { TripLog, TripLogCreate } from '../types/logbook';

export const getTrips = (carId: number): Promise<TripLog[]> =>
  api.get<TripLog[]>(`/modules/logbook/cars/${carId}`).then((r) => r.data);

export const createTrip = (carId: number, trip: TripLogCreate): Promise<TripLog> =>
  api.post<TripLog>(`/modules/logbook/cars/${carId}`, trip).then((r) => r.data);

export const deleteTrip = (tripId: number): Promise<void> =>
  api.delete(`/modules/logbook/${tripId}`).then(() => undefined);
