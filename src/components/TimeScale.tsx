import React from "react";
import MyCell from "@/components/MyCell";

export function TimeScale({ }) {
  return <div className='flex flex-row justify-between items-center h-[var(--first-row-height)]'>
    <MyCell className="min-w-[var(--slot-name)] max-w-[var(--slot-name)] p-0 h-[var(--first-row-height)] py-0 bg-[var(--sidebar-accent)]" style={{
      margin: '0px',
      padding: '0rem',
      borderTop: '1px solid var(--foreground)',
      borderLeft: '1px solid var(--foreground)',
      borderBottom: '1px solid var(--foreground)'

    }}>
      scale:</MyCell>
    <MyCell style={{
      padding: '0rem'
    }}>
      <div className=' min-w-[var(--main-space)] bg-gradient-to-r from-(--scale-red) via-(--scale-yellow) to-(--scale-green)'
        style={{
          margin: '0px',
          padding: '0rem',
          // marginLeft: '0.5px',
          borderTop: '1px solid var(--foreground)',
          borderRight: '1px solid var(--foreground)',
          borderBottom: '1px solid var(--foreground)',
          borderLeft: '1px solid var(--foreground)',

          height: 'var(--rainbow-height)',
        }}>
        <div className='flex flex-row justify-between text-[1rem] px-0 dark:tex-slate-300 items-center h-full'>
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
