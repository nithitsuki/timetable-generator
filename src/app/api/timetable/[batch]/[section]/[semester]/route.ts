import { NextRequest, NextResponse } from 'next/server';
import { loadTimetable } from '@/lib/registry';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch: string; section: string; semester: string }> }
) {
  const { batch, section, semester } = await params;
  
  const timetable = loadTimetable(batch, section, semester);
  
  if (!timetable) {
    return NextResponse.json(
      { error: 'Timetable not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(timetable);
}
