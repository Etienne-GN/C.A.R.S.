import api from './client';
import type { Car, CarCreate, CarSummary, CarUpdate } from '../types/car';

export const getCars = (signal?: AbortSignal): Promise<CarSummary[]> =>
  api.get<CarSummary[]>('/cars/', { signal }).then((r) => r.data);

export const getCar = (id: number, signal?: AbortSignal): Promise<Car> =>
  api.get<Car>(`/cars/${id}`, { signal }).then((r) => r.data);

export const createCar = (car: CarCreate): Promise<Car> =>
  api.post<Car>('/cars/', car).then((r) => r.data);

export const updateCar = (id: number, car: CarUpdate): Promise<Car> =>
  api.patch<Car>(`/cars/${id}`, car).then((r) => r.data);

export const deleteCar = (id: number): Promise<void> =>
  api.delete(`/cars/${id}`).then(() => undefined);

export const uploadCarPhoto = (id: number, file: File): Promise<Car> => {
  const form = new FormData();
  form.append('file', file);
  return api.post<Car>(`/cars/${id}/photo`, form).then((r) => r.data);
};

export const deleteCarPhoto = (id: number): Promise<Car> =>
  api.delete<Car>(`/cars/${id}/photo`).then((r) => r.data);

export interface VinDecodeResult {
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  horsepower?: number;
  weight_kg?: number;
  doors?: number;
  body_class?: string;
  cylinders?: number;
  displacement_l?: number;
  plant_country?: string;
}

export const decodeVin = (vin: string): Promise<VinDecodeResult> =>
  api.get<VinDecodeResult>('/cars/decode-vin', { params: { vin } }).then((r) => r.data);
