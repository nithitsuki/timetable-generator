import PageNavigator from '@/components/selectors/PageNavigator';
import { TimeScale } from '@/components/TimeScale';
import { TimeSlots } from '@/components/TimeSlots';
import ClassesData from '@/../public/data/Classes.json';
import TimeTable from '@/components/TimeTable';
import FacultyInfo from '@/components/FacultyInfo';


export default async function Page({ params }: { params: { batch: string, section: string, semester: number } }) {
  const Batches = ClassesData.map((batch) => batch.ClassOf);
  const { batch, section, semester } = params;
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = process.env.NEXT_PUBLIC_BASE_URL || "localhost:3001";
  const baseUrl = `${protocol}://${host}`;
  const timetableRes = await fetch(`${baseUrl}/data/${batch}/${section}/${semester}/timetable.json`);
  const TimeTableData = await timetableRes.json();

  const coursesRes = await fetch(`${baseUrl}/data/${batch}/${section}/${semester}/courses.json`);
  const coursesData = await coursesRes.json();
  // const [TimeTableData, setTimeTableData] = React.useState<any>({});
  // const [coursesData, setCoursesData] = React.useState<any>({});

  // useEffect(() => {
  //   setChosenClass(ClassesData.find(batch => batch.ClassOf === chosenBatch)?.Classes[0] || "");
  // },
  //   [chosenBatch]
  // )
  // useEffect(() => {
  //   import(`@/data/${chosenBatch}/${chosenClass}/courses.json`)
  //     .then((coursesData) => {
  //       setCoursesData(coursesData.default);
  //     })
  //     .catch((error) => console.error("Failed to load timetable data:", error));
  // }, [chosenBatch, chosenClass]);

  // useEffect(() => {
  //   import(`@/data/${chosenBatch}/${chosenClass}/timetable.json`)
  //     .then((TimeTableData) => {
  //       setTimeTableData(TimeTableData.default);
  //     })
  //     .catch((error) => console.error("Failed to load timetable data:", error));
  // }, [chosenBatch, chosenClass]);

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