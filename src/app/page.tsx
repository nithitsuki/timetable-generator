import React from 'react';
import { TimeScale } from './../components/TimeScale';
import { TimeSlots } from '@/components/TimeSlots';
import TimeTable from '@/components/TimeTable';
import FacultyInfo from '@/components/FacultyInfo';
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
  return (
    <div className="flex mt-4 justify-center min-h-screen">

      <ModeToggle />
      {/* Main sqr box */}
      <div className="w-[640px] h-[640px] outline-1 outline-offset-[0px]">
        <TimeScale />
        <TimeSlots />
        <TimeTable />
        <FacultyInfo />

      </div>
    </div >
  );
}