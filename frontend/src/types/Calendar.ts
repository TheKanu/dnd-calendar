export interface CalendarConfig {
  year_len: number;
  events: number;
  n_months: number;
  months: string[];
  month_len: Record<string, number>;
  week_len: number;
  weekdays: string[];
  n_moons: number;
  moons: string[];
  lunar_cyc: Record<string, number>;
  lunar_shf: Record<string, number>;
  year: number;
  first_day: number;
  notes: Record<string, any>;
}

export interface CalendarEvent {
  id: number;
  year: number;
  month: number;
  day: number;
  title: string;
  description?: string;
  confirmed?: boolean;
  is_recurring?: boolean;
  recurring_parent_id?: number;
  category_id?: number;
  created_at: string;
}

export interface MoonPhase {
  name: string;
  phase: number;
  cycle: number;
}