"use client";
import React, { use, useEffect } from 'react';
import { TimeScale } from './../components/TimeScale';
import { TimeSlots } from '@/components/TimeSlots';

import ClassesData from '@/data/Classes.json';
import TimeTable from '@/components/TimeTable';
import FacultyInfo from '@/components/FacultyInfo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ModeToggle from '@/components/comp-130';
import html2canvas from 'html2canvas';

export default function Home() {
  const Batches = ClassesData.map((batch) => batch.ClassOf);
  const [chosenBatch, setChosenBatch] = React.useState(Batches[0]);
  const [chosenClass, setChosenClass] = React.useState(ClassesData[0].Classes[0]);
  const [TimeTableData, setTimeTableData] = React.useState<any>({});
  const [coursesData, setCoursesData] = React.useState<any>({});

  useEffect(() => {
    setChosenClass(ClassesData.find(batch => batch.ClassOf === chosenBatch)?.Classes[0] || "");
  },
    [chosenBatch]
  )
  useEffect(() => {
    import(`@/data/${chosenBatch}/${chosenClass}/courses.json`)
      .then((coursesData) => {
        setCoursesData(coursesData.default);
      })
      .catch((error) => console.error("Failed to load timetable data:", error));
  }, [chosenBatch, chosenClass]);

  useEffect(() => {
    import(`@/data/${chosenBatch}/${chosenClass}/timetable.json`)
      .then((TimeTableData) => {
        setTimeTableData(TimeTableData.default);
      })
      .catch((error) => console.error("Failed to load timetable data:", error));
  }, [chosenBatch, chosenClass]);

  return (
    <div className="flex  flex-col mt-4 items-center  min-h-screen">

      <div className='flex flex-row items-center justify-evenly w-[640px] mb-2'>
        <Select defaultValue={chosenBatch} onValueChange={(value) => { setChosenBatch(value); }}>
          <SelectTrigger className="w-[140px]">

            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            {
              Batches.map((batch, id) => (
                <SelectItem key={id} value={batch}>{batch}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>


        <div id='theme_toggle' className='flex flex-row items-center justify-center mr-2'>
          <h3>Flashbang:&nbsp;&nbsp;</h3>
          <ModeToggle />
        </div>

        <Select defaultValue={chosenClass} onValueChange={(value) => { setChosenClass(value); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {
              ClassesData.find(batch => batch.ClassOf === chosenBatch)?.Classes.map((cls, id) => (
                <SelectItem key={id} value={cls} onClick={() => setChosenClass(cls)}>{cls}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>
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