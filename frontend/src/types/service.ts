export interface Part {
  id: number;
  service_record_id: number;
  name: string;
  part_number?: string;
  brand?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier?: string;
  notes?: string;
}

export interface PartCreate {
  name: string;
  part_number?: string;
  brand?: string;
  quantity: number;
  unit_cost: number;
  supplier?: string;
  notes?: string;
}

export type PartUpdate = Partial<PartCreate>;

export interface Attachment {
  id: number;
  service_record_id: number;
  filename: string;
  original_filename: string;
  mime_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface ServiceRecord {
  id: number;
  car_id: number;
  title: string;
  date: string;
  mileage_at_service?: number;
  shop_name?: string;
  labor_cost: number;
  notes?: string;
  created_at: string;
  total_cost: number;
  parts: Part[];
  attachments: Attachment[];
}

export interface ServiceRecordCreate {
  title: string;
  date: string;
  mileage_at_service?: number;
  shop_name?: string;
  labor_cost: number;
  notes?: string;
  parts: PartCreate[];
}

export type ServiceRecordUpdate = Partial<Omit<ServiceRecordCreate, 'parts'>>;
