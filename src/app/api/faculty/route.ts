import { NextResponse } from 'next/server';
import { getAllFaculty, getFacultySchedule, searchFaculty, FacultySummary, FacultySchedule } from '@/lib/faculty';

export interface FacultyListResponse {
  faculty: FacultySummary[];
}

export interface FacultyScheduleResponse {
  schedule: FacultySchedule | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const query = searchParams.get('q');
  
  // If a specific faculty name is provided, return their schedule
  if (name) {
    const schedule = getFacultySchedule(name);
    return NextResponse.json({ schedule } as FacultyScheduleResponse);
  }
  
  // If a search query is provided, return matching faculty
  if (query) {
    const faculty = searchFaculty(query);
    return NextResponse.json({ faculty } as FacultyListResponse);
  }
  
  // Otherwise, return all faculty
  const faculty = getAllFaculty();
  return NextResponse.json({ faculty } as FacultyListResponse);
}

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour
