import React from "react";
import MyCell from "@/components/MyCell";

export function TimeScale({}) {
  return <div className='flex flex-row justify-between items-center h-(--first-row-height)'>
          <MyCell className="min-w-(--slot-name) max-w-(--slot-name) p-0 h-(--first-row-height) py-0 bg-(--sidebar-accent)" style={{
      margin: '0px',
      padding: '0rem'
    }}>
          scale:</MyCell>
          <MyCell style={{
      padding: '0rem'
    }}>
          <div className='h-(--first-row-height) min-w-(--main-space) bg-gradient-to-r from-[#c75757] via-[#c7c757] to-[#57c757]'>
            <div className='flex flex-row justify-between text-[1rem] px-0 text-black items-center h-full px-0'>
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          </MyCell>
        </div>;
}
  