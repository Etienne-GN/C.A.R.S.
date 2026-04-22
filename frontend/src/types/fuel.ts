export interface FuelLogEntry {
  id: number;
  car_id: number;
  date: string;
  odometer: number;
  litres: number;
  price_per_litre: number;
  station?: string;
  full_tank: boolean;
  total_cost: number;
  l_per_100km?: number;
}

export interface FuelLogCreate {
  date: string;
  odometer: number;
  litres: number;
  price_per_litre: number;
  station?: string;
  full_tank: boolean;
}
