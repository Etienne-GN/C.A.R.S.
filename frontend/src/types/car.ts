export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color: string;
  owner: string;
}

export interface CarCreate {
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color: string;
  owner: string;
}

export interface CarUpdate {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  license_plate?: string;
  color?: string;
  owner?: string;
}
