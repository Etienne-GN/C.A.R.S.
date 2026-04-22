export interface CarNote {
  id: number;
  car_id: number;
  title: string;
  body?: string;
  created_at: string;
  updated_at: string;
}

export interface CarNoteCreate {
  title: string;
  body?: string;
}

export interface CarNoteUpdate {
  title?: string;
  body?: string;
}
