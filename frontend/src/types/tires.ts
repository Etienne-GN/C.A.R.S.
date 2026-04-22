export interface TreadSnapshot {
  date: string;
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
}

export interface TireSet {
  id: number;
  car_id: number;
  name: string;
  brand?: string;
  model?: string;
  size?: string;
  season?: string;
  installed_date?: string;
  installed_odometer?: number;
  notes?: string;
  latest_tread?: TreadSnapshot;
  readings_count: number;
}

export interface TireSetCreate {
  name: string;
  brand?: string;
  model?: string;
  size?: string;
  season?: string;
  installed_date?: string;
  installed_odometer?: number;
  notes?: string;
}

export type TireSetUpdate = Partial<TireSetCreate>;

export interface TreadReadingCreate {
  date: string;
  odometer?: number;
  fl?: number;
  fr?: number;
  rl?: number;
  rr?: number;
}
