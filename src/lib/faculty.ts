import { Timetable, DayOfWeek, parseSlotRef, Subject } from './types';
import { buildTimetableIndex, loadTimetable } from './registry';

// Days of the week
export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

// Cache for all timetables
let cachedTimetables: {
  batch: string;
  section: string;
  semester: string;
  timetable: Timetable;
}[] | null = null;

function loadAllTimetables() {
  if (cachedTimetables) return cachedTimetables;
  
  const index = buildTimetableIndex();
  const timetables: typeof cachedTimetables = [];
  
  for (const [batch, sections] of Object.entries(index.batches)) {
    for (const [section, semesters] of Object.entries(sections)) {
      for (const semester of semesters) {
        const timetable = loadTimetable(batch, section, semester);
        if (timetable) {
          timetables.push({ batch, section, semester, timetable });
        }
      }
    }
  }
  
  cachedTimetables = timetables;
  return timetables;
}

/**
 * Normalize faculty name for consistent comparison
 */
export function normalizeFacultyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.)\s*/i, '')
    .trim();
}

/**
 * Extract all unique faculty names from all timetables
 */
export function getAllFaculty(): FacultySummary[] {
  const timetables = loadAllTimetables();
  const facultyMap = new Map<string, { 
    name: string; 
    subjects: Set<string>; 
    classes: Set<string>;
  }>();
  
  for (const { batch, section, semester, timetable } of timetables) {
    for (const subject of Object.values(timetable.subjects)) {
      for (const facultyName of subject.faculty) {
        const normalized = normalizeFacultyName(facultyName);
        
        if (!facultyMap.has(normalized)) {
          facultyMap.set(normalized, {
            name: facultyName, // Keep original name with title
            subjects: new Set(),
            classes: new Set(),
          });
        }
        
        const entry = facultyMap.get(normalized)!;
        entry.subjects.add(subject.code);
        entry.classes.add(`${batch}-${section}-${semester}`);
      }
    }
  }
  
  // Convert to array and sort by name
  return Array.from(facultyMap.values())
    .map(f => ({
      name: f.name,
      subjectCount: f.subjects.size,
      classCount: f.classes.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get the complete schedule for a specific faculty member
 */
export function getFacultySchedule(facultyName: string): FacultySchedule | null {
  const timetables = loadAllTimetables();
  const normalizedSearch = normalizeFacultyName(facultyName);
  
  // Find all subjects and classes this faculty teaches
  const slots: FacultySlot[] = [];
  const subjectsMap = new Map<string, {
    code: string;
    name: string;
    shortName: string;
    classes: Set<string>;
  }>();
  
  let actualFacultyName = facultyName;
  
  for (const { batch, section, semester, timetable } of timetables) {
    // Find subjects taught by this faculty in this timetable
    const facultySubjects = new Map<string, Subject>();
    
    for (const [key, subject] of Object.entries(timetable.subjects)) {
      for (const fname of subject.faculty) {
        if (normalizeFacultyName(fname) === normalizedSearch) {
          facultySubjects.set(key, subject);
          actualFacultyName = fname; // Use the actual name from data
          
          // Track subject info
          if (!subjectsMap.has(subject.code)) {
            subjectsMap.set(subject.code, {
              code: subject.code,
              name: subject.name,
              shortName: subject.shortName,
              classes: new Set(),
            });
          }
          subjectsMap.get(subject.code)!.classes.add(`${batch}|${section}|${semester}`);
        }
      }
    }
    
    if (facultySubjects.size === 0) continue;
    
    // Process schedule for this class
    for (const day of DAYS) {
      const daySchedule = timetable.schedule[day];
      if (!daySchedule) continue;
      
      let i = 0;
      while (i < daySchedule.length) {
        const slotRef = daySchedule[i];
        
        // Resolve the slot (handles config-based slots)
        // For teacher view, we need to check all possible config combinations
        // For simplicity, we check the raw reference first
        const { subjectKey, isLab } = parseSlotRef(slotRef);
        
        // Check if this is a direct subject reference
        if (facultySubjects.has(subjectKey)) {
          const subject = facultySubjects.get(subjectKey)!;
          
          // Check for consecutive same slots (labs)
          let span = 1;
          while (
            i + span < daySchedule.length &&
            daySchedule[i + span] === slotRef
          ) {
            span++;
          }
          
          slots.push({
            day,
            slotIndex: i,
            subjectCode: subject.code,
            subjectName: subject.name,
            shortName: subject.shortName,
            isLab,
            batch,
            section,
            semester,
            spanStart: i,
            spanEnd: i + span - 1,
          });
          
          i += span;
          continue;
        }
        
        // Check if it's a slot reference that resolves to a faculty's subject
        const slotDef = timetable.slots[slotRef];
        if (slotDef) {
          // Simple slot - check all choices
          if ('choices' in slotDef && typeof slotDef.match === 'string') {
            for (const choice of Object.values(slotDef.choices)) {
              const { subjectKey: choiceKey, isLab: choiceIsLab } = parseSlotRef(choice);
              if (facultySubjects.has(choiceKey)) {
                const subject = facultySubjects.get(choiceKey)!;
                
                // Check for consecutive slots
                let span = 1;
                while (
                  i + span < daySchedule.length &&
                  daySchedule[i + span] === slotRef
                ) {
                  span++;
                }
                
                slots.push({
                  day,
                  slotIndex: i,
                  subjectCode: subject.code,
                  subjectName: subject.name,
                  shortName: subject.shortName,
                  isLab: choiceIsLab,
                  batch,
                  section,
                  semester,
                  spanStart: i,
                  spanEnd: i + span - 1,
                });
                
                i += span - 1; // -1 because we'll increment at end
                break;
              }
            }
          }
          
          // Complex slot - check all choices
          if (Array.isArray(slotDef.match)) {
            const complexSlot = slotDef as { match: string[]; choices: { pattern: string[]; value: string }[] };
            for (const choice of complexSlot.choices) {
              const { subjectKey: choiceKey, isLab: choiceIsLab } = parseSlotRef(choice.value);
              if (facultySubjects.has(choiceKey)) {
                const subject = facultySubjects.get(choiceKey)!;
                
                // Check for consecutive slots
                let span = 1;
                while (
                  i + span < daySchedule.length &&
                  daySchedule[i + span] === slotRef
                ) {
                  span++;
                }
                
                slots.push({
                  day,
                  slotIndex: i,
                  subjectCode: subject.code,
                  subjectName: subject.name,
                  shortName: subject.shortName,
                  isLab: choiceIsLab,
                  batch,
                  section,
                  semester,
                  spanStart: i,
                  spanEnd: i + span - 1,
                });
                
                i += span - 1;
                break;
              }
            }
          }
        }
        
        i++;
      }
    }
  }
  
  if (slots.length === 0) {
    return null;
  }
  
  // Convert subjects map to array
  const subjects = Array.from(subjectsMap.values()).map(s => ({
    code: s.code,
    name: s.name,
    shortName: s.shortName,
    classes: Array.from(s.classes).map(c => {
      const [batch, section, semester] = c.split('|');
      return { batch, section, semester };
    }),
  }));
  
  return {
    name: actualFacultyName,
    slots,
    subjects,
  };
}

/**
 * Search faculty by name (partial match)
 */
export function searchFaculty(query: string): FacultySummary[] {
  const allFaculty = getAllFaculty();
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return allFaculty;
  
  return allFaculty.filter(f => 
    f.name.toLowerCase().includes(normalizedQuery)
  );
}
