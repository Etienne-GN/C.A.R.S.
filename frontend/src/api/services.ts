import api from './client';
import type { Part, PartCreate, PartUpdate, ServiceRecord, ServiceRecordCreate, ServiceRecordUpdate } from '../types/service';

export const getServices = (carId: number, signal?: AbortSignal): Promise<ServiceRecord[]> =>
  api.get<ServiceRecord[]>(`/cars/${carId}/services/`, { signal }).then((r) => r.data);

export const getService = (serviceId: number, signal?: AbortSignal): Promise<ServiceRecord> =>
  api.get<ServiceRecord>(`/services/${serviceId}`, { signal }).then((r) => r.data);

export const createService = (carId: number, record: ServiceRecordCreate): Promise<ServiceRecord> =>
  api.post<ServiceRecord>(`/cars/${carId}/services/`, record).then((r) => r.data);

export const updateService = (serviceId: number, record: ServiceRecordUpdate): Promise<ServiceRecord> =>
  api.patch<ServiceRecord>(`/services/${serviceId}`, record).then((r) => r.data);

export const deleteService = (serviceId: number): Promise<void> =>
  api.delete(`/services/${serviceId}`).then(() => undefined);

export const addPart = (serviceId: number, part: PartCreate): Promise<Part> =>
  api.post<Part>(`/services/${serviceId}/parts/`, part).then((r) => r.data);

export const updatePart = (partId: number, part: PartUpdate): Promise<Part> =>
  api.patch<Part>(`/parts/${partId}`, part).then((r) => r.data);

export const deletePart = (partId: number): Promise<void> =>
  api.delete(`/parts/${partId}`).then(() => undefined);

export const uploadAttachment = (serviceId: number, file: File): Promise<import('../types/service').Attachment> => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/services/${serviceId}/attachments/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

export const deleteAttachment = (attachmentId: number): Promise<void> =>
  api.delete(`/attachments/${attachmentId}`).then(() => undefined);
