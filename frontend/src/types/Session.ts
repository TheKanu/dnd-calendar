export interface Session {
  id: string;
  name: string;
  description?: string;
  start_year?: number;
  start_month?: number;
  created_at: string;
}

export interface PartyGroup {
  id: number;
  session_id: string;
  name: string;
  color: string;
  current_year: number;
  current_month: number;
  current_day: number;
  created_at: string;
}