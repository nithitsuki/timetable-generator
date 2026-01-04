import { NextResponse } from 'next/server';
import { buildTimetableIndex } from '@/lib/registry';

export async function GET() {
  const index = buildTimetableIndex();
  return NextResponse.json(index);
}

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour
