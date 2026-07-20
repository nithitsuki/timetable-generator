import { NextResponse } from 'next/server';
import { buildTimetableIndex, loadTimetable } from '@/lib/registry';
import { Timetable } from '@/lib/types';

export interface TimetableEntry {
  batch: string;
  section: string;
  semester: string;
  timetable: Timetable;
}

export interface TimetablesResponse {
  timetables: TimetableEntry[];
}

export async function GET() {
  const index = buildTimetableIndex();
  const timetables: TimetableEntry[] = [];
  
  for (const [batch, sections] of Object.entries(index.batches)) {
    for (const [section, semesters] of Object.entries(sections)) {
      const latestSemester = semesters[semesters.length - 1];
      const timetable = loadTimetable(batch, section, latestSemester);
      if (timetable) {
        timetables.push({
          batch,
          section,
          semester: latestSemester,
          timetable,
        });
      }
    }
  }
  
  return NextResponse.json({ timetables } as TimetablesResponse);
}

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour
