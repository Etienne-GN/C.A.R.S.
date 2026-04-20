import axios from 'axios';
import type { Car, CarCreate, CarUpdate } from '../types/car';

const api = axios.create();

export const getCars = (signal?: AbortSignal): Promise<Car[]> =>
  api.get<Car[]>('/cars/', { signal }).then((r) => r.data);

export const getCar = (id: number, signal?: AbortSignal): Promise<Car> =>
  api.get<Car>(`/cars/${id}`, { signal }).then((r) => r.data);

export const createCar = (car: CarCreate): Promise<Car> =>
  api.post<Car>('/cars/', car).then((r) => r.data);

export const updateCar = (id: number, car: CarUpdate): Promise<Car> =>
  api.patch<Car>(`/cars/${id}`, car).then((r) => r.data);

export const deleteCar = (id: number): Promise<void> =>
  api.delete(`/cars/${id}`).then(() => undefined);
