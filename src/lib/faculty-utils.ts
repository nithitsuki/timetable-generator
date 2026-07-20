// Client-side faculty utilities
// These functions work with timetable data fetched from /api/timetables

import { Timetable, DayOfWeek, parseSlotRef, FacultySlot, FacultySchedule, FacultySummary, getElectiveLabel } from './types';

// Days of the week
export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface TimetableEntry {
  batch: string;
  section: string;
  semester: string;
  timetable: Timetable;
}

/**
 * Strip title prefixes (Dr., Mr., Ms., etc.) from faculty name for sorting/grouping
 */
export function stripTitle(name: string): string {
  return name
    .trim()
    .replace(/^(dr\.|mr\.|ms\.|mrs\.|prof\.)\s*/i, '')
    .trim();
}

/**
 * Normalize faculty name for consistent comparison
 */
export function normalizeFacultyName(name: string): string {
  return stripTitle(name).toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Get sort key for faculty name (strips title, then sorts)
 */
export function getFacultySortKey(name: string): string {
  return stripTitle(name).toLowerCase();
}

/**
 * Get the first letter for grouping (after stripping title)
 */
export function getFirstLetter(name: string): string {
  const stripped = stripTitle(name);
  return stripped.charAt(0).toUpperCase();
}

/**
 * Extract all unique faculty from timetables
 */
export function extractAllFaculty(timetables: TimetableEntry[]): FacultySummary[] {
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
            name: facultyName,
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
  
  // Convert to array and sort by name (ignoring titles)
  return Array.from(facultyMap.values())
    .map(f => ({
      name: f.name,
      subjectCount: f.subjects.size,
      classCount: f.classes.size,
    }))
    .sort((a, b) => getFacultySortKey(a.name).localeCompare(getFacultySortKey(b.name)));
}

/**
 * Build schedule for a specific faculty member
 */
export function buildFacultySchedule(
  facultyName: string,
  timetables: TimetableEntry[]
): FacultySchedule | null {
  const normalizedSearch = normalizeFacultyName(facultyName);
  
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
    const facultySubjects = new Map<string, typeof timetable.subjects[string]>();
    
    for (const [key, subject] of Object.entries(timetable.subjects)) {
      for (const fname of subject.faculty) {
        if (normalizeFacultyName(fname) === normalizedSearch) {
          facultySubjects.set(key, subject);
          actualFacultyName = fname;
          
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
            electiveLabel: getElectiveLabel(subjectKey, timetable) ?? undefined,
          });
          
          i += span;
          continue;
        }
        
        // Check if it's a slot reference that resolves to a faculty's subject
        const slotDef = timetable.slots[slotRef];
        if (slotDef) {
          let found = false;
          
          // Simple slot - check all choices
          if ('choices' in slotDef && typeof slotDef.match === 'string') {
            for (const choice of Object.values(slotDef.choices)) {
              const { subjectKey: choiceKey, isLab: choiceIsLab } = parseSlotRef(choice);
              if (facultySubjects.has(choiceKey)) {
                const subject = facultySubjects.get(choiceKey)!;
                
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
                  electiveLabel: getElectiveLabel(choiceKey, timetable) ?? undefined,
                });
                
                i += span - 1;
                found = true;
                break;
              }
            }
          }
          
          // Complex slot - check all choices
          if (!found && Array.isArray(slotDef.match)) {
            const complexSlot = slotDef as { match: string[]; choices: { pattern: string[]; value: string }[] };
            for (const choice of complexSlot.choices) {
              const { subjectKey: choiceKey, isLab: choiceIsLab } = parseSlotRef(choice.value);
              if (facultySubjects.has(choiceKey)) {
                const subject = facultySubjects.get(choiceKey)!;
                
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
                  electiveLabel: getElectiveLabel(choiceKey, timetable) ?? undefined,
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
 * Group faculty by first letter
 */
export function groupFacultyByLetter(faculty: FacultySummary[]): Map<string, FacultySummary[]> {
  const groups = new Map<string, FacultySummary[]>();
  
  for (const f of faculty) {
    const letter = getFirstLetter(f.name);
    if (!groups.has(letter)) {
      groups.set(letter, []);
    }
    groups.get(letter)!.push(f);
  }
  
  return groups;
}

/**
 * Search/filter faculty by name
 */
export function filterFaculty(faculty: FacultySummary[], query: string): FacultySummary[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return faculty;
  
  return faculty.filter(f => 
    f.name.toLowerCase().includes(normalizedQuery) ||
    stripTitle(f.name).toLowerCase().includes(normalizedQuery)
  );
}
