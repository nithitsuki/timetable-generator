import React from 'react';
import { TimeScale } from './../components/TimeScale';
import { TimeSlots } from '@/components/TimeSlots';
import TimeTable from '@/components/TimeTable';
import FacultyInfo from '@/components/FacultyInfo';

export default function Home() {
  return (
    <div className="flex mt-4 justify-center min-h-screen">

      {/* Main sqr box */}
      <div className="w-[640px] h-[640px] outline-2 border-gray-300">

        <TimeScale />
        <TimeSlots />
        <hr className='m-[2px]'></hr>
        <TimeTable />
        <hr className='m-[2px]'></hr>
        <FacultyInfo />

      </div>
    </div >
  );
}