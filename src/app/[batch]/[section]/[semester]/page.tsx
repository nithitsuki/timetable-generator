import { redirect } from 'next/navigation';
import PageNavigator from '@/components/selectors/PageNavigator';
import FetchErrors from '@/errors.json';
import { TimeScale } from '@/components/TimeScale';
import { TimeSlots } from '@/components/TimeSlots';
import ClassesData from '@/../public/data/Classes.json';
import TimeTable from '@/components/TimeTable';
import FacultyInfo from '@/components/FacultyInfo';


export default async function Page({ params, }: {params: Promise<{
  batch: string;
  section: string;
  semester: string;
}>;}) {
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

      <div className='flex flex-row items-center justify-evenly w-[640px] mb-2'>

        <PageNavigator batch={batch} section={section} semester={semester} batches={Batches} sections={ClassesData.find(b => b.ClassOf === batch)?.Classes || []} />


      </div>
      {/* Main sqr box */}
      <div id="mainbox" className="w-[640px] h-[640px] outline-1 outline-offset-[0px]">
        <TimeScale />
        <TimeSlots />
        <TimeTable TimetableData={TimeTableData} />
        <FacultyInfo coursesData={coursesData} />

      </div>
    </div >
  );
}