export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color?: string;
  owner?: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_mileage?: number;
  current_mileage?: number;
  notes?: string;
  service_records: import('./service').ServiceRecord[];
  scheduled_maintenance: import('./maintenance').ScheduledMaintenance[];
}

export interface CarSummary {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color?: string;
  owner?: string;
  trim?: string;
  current_mileage?: number;
  service_count: number;
  total_spent: number;
  last_service_date?: string;
  next_due_date?: string;
}

export interface CarCreate {
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color?: string;
  owner?: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_mileage?: number;
  current_mileage?: number;
  notes?: string;
}

export type CarUpdate = Partial<CarCreate>;
