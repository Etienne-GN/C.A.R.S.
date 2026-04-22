import api from './client';
import type { CarNote, CarNoteCreate, CarNoteUpdate } from '../types/note';

export const getNotes = (carId: number): Promise<CarNote[]> =>
  api.get<CarNote[]>(`/cars/${carId}/notes`).then((r) => r.data);

export const createNote = (carId: number, note: CarNoteCreate): Promise<CarNote> =>
  api.post<CarNote>(`/cars/${carId}/notes`, note).then((r) => r.data);

export const updateNote = (noteId: number, note: CarNoteUpdate): Promise<CarNote> =>
  api.patch<CarNote>(`/cars/notes/${noteId}`, note).then((r) => r.data);

export const deleteNote = (noteId: number): Promise<void> =>
  api.delete(`/cars/notes/${noteId}`).then(() => undefined);
