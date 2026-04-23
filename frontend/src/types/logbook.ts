export interface TripLog {
  id: number;
  car_id: number;
  date: string;
  distance_km: number;
  start_location?: string;
  end_location?: string;
  duration_min?: number;
  purpose?: string;
  fuel_cost?: number;
  notes?: string;
}

export interface TripLogCreate {
  date: string;
  distance_km: number;
  start_location?: string;
  end_location?: string;
  duration_min?: number;
  purpose?: string;
  fuel_cost?: number;
  notes?: string;
}
