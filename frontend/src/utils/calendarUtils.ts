import { CalendarConfig, MoonPhase } from '../types/Calendar';

export const getDayOfWeek = (year: number, month: number, day: number, config: CalendarConfig): number => {
  let totalDays = 0;
  
  for (let y = 0; y < year; y++) {
    totalDays += config.year_len;
  }
  
  for (let m = 0; m < month; m++) {
    const monthName = config.months[m];
    totalDays += config.month_len[monthName];
  }
  
  totalDays += day - 1;
  
  return (totalDays + config.first_day) % config.week_len;
};

export const getMoonPhases = (year: number, month: number, day: number, config: CalendarConfig): MoonPhase[] => {
  let totalDays = 0;
  
  for (let y = 0; y < year; y++) {
    totalDays += config.year_len;
  }
  
  for (let m = 0; m < month; m++) {
    const monthName = config.months[m];
    totalDays += config.month_len[monthName];
  }
  
  totalDays += day - 1;
  
  return config.moons.map(moon => {
    const cycle = config.lunar_cyc[moon];
    const shift = config.lunar_shf[moon];
    const phase = (totalDays + shift) % cycle;
    
    return {
      name: moon,
      phase,
      cycle
    };
  });
};

export const getWeekGrid = (year: number, monthIndex: number, config: CalendarConfig): number[][] => {
  const monthName = config.months[monthIndex];
  const daysInMonth = config.month_len[monthName];
  const firstDayOfWeek = getDayOfWeek(year, monthIndex, 1, config);
  
  const weeks: number[][] = [];
  let currentWeek: number[] = new Array(firstDayOfWeek).fill(0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    
    if (currentWeek.length === config.week_len) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < config.week_len) {
      currentWeek.push(0);
    }
    weeks.push(currentWeek);
  }
  
  return weeks;
};