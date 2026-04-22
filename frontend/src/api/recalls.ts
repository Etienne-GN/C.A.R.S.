import api from './client';

export interface Recall {
  recall_id: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  report_date: string;
}

export const checkRecalls = (make: string, model: string, year: number): Promise<Recall[]> =>
  api.get<Recall[]>('/modules/recalls/', { params: { make, model, year } }).then((r) => r.data);
