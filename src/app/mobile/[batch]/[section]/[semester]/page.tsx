import { redirect } from 'next/navigation';
import PageNavigator from './PageNavigator';
import FetchErrors from '@/errors.json';
import { TimeTable } from './TimeTable';
import ClassesData from '@/../public/data/Classes.json';
// import TimeTable from './SSTimeTable';


export default async function Page({ params, }: {
  params: Promise<{
    batch: string;
    section: string;
    semester: string;
  }>;
}) {
  const Batches = ClassesData.map((batch) => batch.ClassOf);
  const { batch, section, semester } = await params;
  const baseUrl = (process.env.NODE_ENV === "development") ? "http://localhost:3000" : process.env.NEXT_PUBLIC_BASE_URL;
  let TimeTableData = FetchErrors["timetable.json"];
  let coursesData = {};

  const timetableRes = await fetch(`${baseUrl}/data/${batch}/${section}/${semester}/timetable.json`);
  if (timetableRes.ok) { TimeTableData = await timetableRes.json(); }
  else { redirect("/404"); return; }

  const coursesRes = await fetch(`${baseUrl}/data/${batch}/${section}/${semester}/courses.json`);
  if (coursesRes.ok) { coursesData = await coursesRes.json(); }


  return (
    <div className="flex  flex-col mt-4 items-center  min-h-screen">

      <div className='flex flex-row items-center justify-evenly w-[100%] mb-2'>

        <PageNavigator batch={batch} section={section} semester={semester} batches={Batches} sections={ClassesData.find(b => b.ClassOf === batch)?.Classes || []} />


      </div>
      {/* Main sqr box */}
      <div id="mainbox" className="w-[96vw] h-[90vh] outline-1 relative">
        {/* <TimeScale /> */}
        {/* <TimeSlots /> */}
        <TimeTable TimetableData={TimeTableData} />

        {/* <FacultyInfo coursesData={coursesData} /> */}

      </div>
    </div >
  );
}