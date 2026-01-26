import { Timetable, DayOfWeek } from './types';

// Theory slot timings (50 min each)
export const THEORY_SLOTS = [
  { index: 0, start: '08:10', end: '09:00' },
  { index: 1, start: '09:00', end: '09:50' },
  { index: 2, start: '09:50', end: '10:40' },
  { index: 3, start: '11:00', end: '11:50' },
  { index: 4, start: '11:50', end: '12:40' },
  { index: 5, start: '14:00', end: '14:50' },
  { index: 6, start: '14:50', end: '15:40' },
];

// Lab slot timings
export const LAB_SLOTS = [
  { name: 'morning', start: '08:10', end: '10:25', indices: [0, 1, 2] },
  { name: 'midday', start: '10:50', end: '13:05', indices: [3, 4] },
  { name: 'afternoon', start: '13:25', end: '15:40', indices: [5, 6] },
];

// Days of the week
export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Convert HH:MM to minutes since midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to HH:MM
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Get day of week from Date
export function getDayOfWeek(date: Date): DayOfWeek | null {
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayMap: Record<number, DayOfWeek> = {
    1: 'Monday',
    2: 'Tuesday', 
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Sunday',
  };
  return dayMap[dayIndex] || null;
}

// Get current slot index based on time
export function getCurrentSlotIndex(time: string): number | null {
  const currentMinutes = timeToMinutes(time);
  
  for (let i = 0; i < THEORY_SLOTS.length; i++) {
    const slot = THEORY_SLOTS[i];
    const startMin = timeToMinutes(slot.start);
    const endMin = timeToMinutes(slot.end);
    
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      return i;
    }
  }
  
  // Check break times and return next slot
  const teaBreakEnd = timeToMinutes('11:00');
  const lunchEnd = timeToMinutes('14:00');
  
  if (currentMinutes >= timeToMinutes('10:40') && currentMinutes < teaBreakEnd) {
    return 3; // Next slot after tea break
  }
  
  if (currentMinutes >= timeToMinutes('12:40') && currentMinutes < lunchEnd) {
    return 5; // Next slot after lunch
  }
  
  return null;
}

// Check if a slot reference is FREE
export function isSlotFree(slotRef: string): boolean {
  return slotRef === 'FREE' || slotRef === 'free';
}

// Get schedule for a specific day
export function getScheduleForDay(timetable: Timetable, day: DayOfWeek): string[] {
  return timetable.schedule[day] || [];
}

// Check if a class is free at a specific slot index on a day
export function isClassFreeAtSlot(
  timetable: Timetable,
  day: DayOfWeek,
  slotIndex: number
): boolean {
  const schedule = getScheduleForDay(timetable, day);
  
  if (slotIndex < 0 || slotIndex >= schedule.length) {
    // No class scheduled - could be considered free
    return true;
  }
  
  const slotRef = schedule[slotIndex];
  return isSlotFree(slotRef);
}

// Get all free slots for a class on a given day
export function getFreeSlots(timetable: Timetable, day: DayOfWeek): number[] {
  const schedule = getScheduleForDay(timetable, day);
  const freeSlots: number[] = [];
  
  // Check all 7 theory slot positions
  for (let i = 0; i < 7; i++) {
    if (i >= schedule.length || isSlotFree(schedule[i])) {
      freeSlots.push(i);
    }
  }
  
  return freeSlots;
}

// Find common free slots between two timetables on a day
export function findCommonFreeSlots(
  timetable1: Timetable,
  timetable2: Timetable,
  day: DayOfWeek
): number[] {
  const free1 = new Set(getFreeSlots(timetable1, day));
  const free2 = getFreeSlots(timetable2, day);
  
  return free2.filter(slot => free1.has(slot));
}

// Interface for a class with its timetable info
export interface ClassInfo {
  batch: string;
  section: string;
  semester: string;
  label: string;
  timetable: Timetable;
}

// Get slot timing info
export function getSlotTiming(slotIndex: number): { start: string; end: string } | null {
  if (slotIndex >= 0 && slotIndex < THEORY_SLOTS.length) {
    return {
      start: THEORY_SLOTS[slotIndex].start,
      end: THEORY_SLOTS[slotIndex].end,
    };
  }
  return null;
}

// Format slot time range for display
export function formatSlotTime(slotIndex: number): string {
  const timing = getSlotTiming(slotIndex);
  if (!timing) return '';
  return `${timing.start} - ${timing.end}`;
}

// Get what subject is at a given slot (resolve LAB references)
export function getSubjectAtSlot(
  timetable: Timetable,
  day: DayOfWeek,
  slotIndex: number
): { name: string; shortName: string; isLab: boolean } | null {
  const schedule = getScheduleForDay(timetable, day);
  
  if (slotIndex < 0 || slotIndex >= schedule.length) {
    return null;
  }
  
  const slotRef = schedule[slotIndex];
  
  if (isSlotFree(slotRef)) {
    return null;
  }
  
  const isLab = slotRef.endsWith('_LAB');
  const subjectKey = isLab ? slotRef.replace('_LAB', '') : slotRef;
  
  // Check if it's a slot reference (for complex timetables)
  if (timetable.slots && timetable.slots[slotRef]) {
    // This is a slot reference, needs config resolution
    return { name: slotRef, shortName: slotRef, isLab: false };
  }
  
  const subject = timetable.subjects[subjectKey];
  if (subject) {
    return {
      name: subject.name,
      shortName: subject.shortName,
      isLab,
    };
  }
  
  return { name: slotRef, shortName: slotRef, isLab: false };
}

// Format class label for display
export function formatClassLabel(batch: string, section: string, semester: string): string {
  const gradYear = parseInt(batch) + 4;
  return `${section.toUpperCase()} - Sem ${semester} (Class of ${gradYear})`;
}

// Format short class label
export function formatShortLabel(section: string, semester: string): string {
  return `${section.toUpperCase()} S${semester}`;
}
