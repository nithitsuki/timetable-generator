import { readdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Timetable, TimetableIndex } from './types';

const REGISTRY_PATH = join(process.cwd(), 'deps/timetable-registry/registry/v2/files');

/**
 * Scans the v2 registry directory and builds an index of available timetables
 */
export function buildTimetableIndex(): TimetableIndex {
  const index: TimetableIndex = { batches: {} };

  if (!existsSync(REGISTRY_PATH)) {
    console.error('Registry path not found:', REGISTRY_PATH);
    return index;
  }

  const years = readdirSync(REGISTRY_PATH, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const year of years) {
    const yearPath = join(REGISTRY_PATH, year);
    const sections = readdirSync(yearPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    index.batches[year] = {};

    for (const section of sections) {
      const sectionPath = join(yearPath, section);
      const files = readdirSync(sectionPath)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });

      if (files.length > 0) {
        index.batches[year][section] = files;
      }
    }
  }

  return index;
}

/**
 * Loads a specific timetable from the v2 registry
 */
export function loadTimetable(batch: string, section: string, semester: string): Timetable | null {
  const filePath = join(REGISTRY_PATH, batch, section, `${semester}.json`);
  
  if (!existsSync(filePath)) {
    console.error('Timetable not found:', filePath);
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as Timetable;
  } catch (error) {
    console.error('Error loading timetable:', error);
    return null;
  }
}

/**
 * Gets the registry path for client-side fetching
 */
export function getTimetablePath(batch: string, section: string, semester: string): string {
  return `/api/timetable/${batch}/${section}/${semester}`;
}
