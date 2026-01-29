// V2 Timetable Schema Types
export interface Subject {
  name: string;
  shortName: string;
  code: string;
  faculty: string[];
}

export interface ConfigValue {
  label: string;
  id: string;
}

export interface ConfigOption {
  label: string;
  values: ConfigValue[];
}

export interface SimpleSlot {
  match: string;
  choices: Record<string, string>;
}

export interface ComplexChoice {
  pattern: string[];
  value: string;
}

export interface ComplexSlot {
  match: string[];
  choices: ComplexChoice[];
}

export type Slot = SimpleSlot | ComplexSlot;

export interface Schedule {
  Monday?: string[];
  Tuesday?: string[];
  Wednesday?: string[];
  Thursday?: string[];
  Friday?: string[];
  Saturday?: string[];
  Sunday?: string[];
}

export interface Timetable {
  $schema?: string;
  subjects: Record<string, Subject>;
  config: Record<string, ConfigOption>;
  slots: Record<string, SimpleSlot | ComplexSlot>;
  schedule: Schedule;
}

// Index types for available timetables
export interface TimetableIndex {
  batches: {
    [year: string]: {
      [section: string]: string[]; // semesters
    };
  };
}

// Day of week type
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Slot timing info
export interface SlotTiming {
  start: string;
  end: string;
  isLab: boolean;
}

// Default slot timings (can be overridden)
export const DEFAULT_SLOT_TIMINGS: SlotTiming[] = [
  { start: '08:10', end: '09:00', isLab: false },
  { start: '09:00', end: '09:50', isLab: false },
  { start: '09:50', end: '10:40', isLab: false },
  { start: '11:00', end: '11:50', isLab: false },
  { start: '11:50', end: '12:40', isLab: false },
  { start: '14:00', end: '14:50', isLab: false },
  { start: '14:50', end: '15:40', isLab: false },
];

// Helper to parse slot references
export function parseSlotRef(slotRef: string): { subjectKey: string; isLab: boolean } {
  const isLab = slotRef.endsWith('_LAB');
  const subjectKey = isLab ? slotRef.replace('_LAB', '') : slotRef;
  return { subjectKey, isLab };
}

// Helper to resolve a slot value given config selections
export function resolveSlot(
  slotRef: string,
  timetable: Timetable,
  configSelections: Record<string, string>
): string | null {
  // If it's a direct subject reference or FREE, return as-is
  if (slotRef === 'FREE' || timetable.subjects[slotRef] || slotRef.endsWith('_LAB')) {
    const parsed = parseSlotRef(slotRef);
    if (slotRef === 'FREE' || timetable.subjects[parsed.subjectKey]) {
      return slotRef;
    }
  }

  // Check if it's a slot reference
  const slotDef = timetable.slots[slotRef];
  if (!slotDef) {
    // Might be a direct subject reference
    return slotRef;
  }

  // Simple slot
  if ('choices' in slotDef && typeof slotDef.match === 'string') {
    const configKey = slotDef.match;
    const selectedValue = configSelections[configKey];
    if (selectedValue && slotDef.choices[selectedValue]) {
      return slotDef.choices[selectedValue];
    }
    // No match found - return null (empty slot)
    return null;
  }

  // Complex slot (multiple config matches)
  if (Array.isArray(slotDef.match)) {
    for (const choice of (slotDef as ComplexSlot).choices) {
      const allMatch = slotDef.match.every((configKey, index) => {
        return configSelections[configKey] === choice.pattern[index];
      });
      if (allMatch) {
        return choice.value;
      }
    }
    return null;
  }

  return slotRef;
}

// Faculty types (for Teacher Schedule Viewer)

// Represents a single teaching slot for a faculty member
export interface FacultySlot {
  day: DayOfWeek;
  slotIndex: number;
  subjectCode: string;
  subjectName: string;
  shortName: string;
  isLab: boolean;
  batch: string;
  section: string;
  semester: string;
  // For labs that span multiple slots
  spanStart?: number;
  spanEnd?: number;
}

// Faculty member with their complete schedule
export interface FacultySchedule {
  name: string;
  slots: FacultySlot[];
  subjects: {
    code: string;
    name: string;
    shortName: string;
    classes: { batch: string; section: string; semester: string }[];
  }[];
}

// Summary info about a faculty member
export interface FacultySummary {
  name: string;
  subjectCount: number;
  classCount: number;
}
