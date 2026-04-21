export interface ScheduledMaintenance {
  id: number;
  car_id: number;
  title: string;
  description?: string;
  due_date?: string;
  due_mileage?: number;
  interval_months?: number;
  interval_km?: number;
  is_completed: boolean;
  created_at: string;
}

export interface ScheduledMaintenanceCreate {
  title: string;
  description?: string;
  due_date?: string;
  due_mileage?: number;
  interval_months?: number;
  interval_km?: number;
}

export type ScheduledMaintenanceUpdate = Partial<ScheduledMaintenanceCreate & { is_completed: boolean }>;
