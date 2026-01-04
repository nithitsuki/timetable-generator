import { redirect } from 'next/navigation';
import { loadTimetable, buildTimetableIndex } from '@/lib/registry';
import TimetableGrid from '@/components/TimetableGrid';
import TimetableHeader from './TimetableHeader';

export default async function Page({ params }: {
  params: Promise<{
    batch: string;
    section: string;
    semester: string;
  }>;
}) {
  const { batch, section, semester } = await params;
  
  // Load timetable data
  const timetable = loadTimetable(batch, section, semester);
  
  if (!timetable) {
    redirect("/404");
  }

  // Load index for navigation
  const index = buildTimetableIndex();
  const batches = Object.keys(index.batches).sort().reverse();
  const sections = Object.keys(index.batches[batch] || {}).sort();
  const semesters = index.batches[batch]?.[section] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <TimetableHeader 
        batch={batch} 
        section={section} 
        semester={semester}
        batches={batches}
        sections={sections}
        semesters={semesters}
      />
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <TimetableGrid timetable={timetable} />
      </main>
    </div>
  );
}

// Generate static params for all available timetables
export async function generateStaticParams() {
  const index = buildTimetableIndex();
  const params: { batch: string; section: string; semester: string }[] = [];
  
  for (const [batch, sections] of Object.entries(index.batches)) {
    for (const [section, semesters] of Object.entries(sections)) {
      for (const semester of semesters) {
        params.push({ batch, section, semester });
      }
    }
  }
  
  return params;
}