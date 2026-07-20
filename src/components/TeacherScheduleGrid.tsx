"use client";
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FacultySchedule, FacultySlot, DayOfWeek } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Days of the week (client-side constant)
const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TeacherScheduleGridProps {
  schedule: FacultySchedule;
}

// Theory slot timings
const THEORY_SLOTS = [
  { start: '08:10', end: '09:00' },
  { start: '09:00', end: '09:50' },
  { start: '09:50', end: '10:40' },
  { start: '11:00', end: '11:50' },
  { start: '11:50', end: '12:40' },
  { start: '14:00', end: '14:50' },
  { start: '14:50', end: '15:40' },
];

// Day abbreviations for mobile
const DAY_ABBREV: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

// Color palette for classes (batch-section-semester combinations)
const CLASS_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200',
  'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
  'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-200',
  'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-200',
  'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
  'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
  'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
  'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200',
];

const LAB_COLORS = 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200';
const MONO_COLOR = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300';
const MONO_LAB = 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 text-slate-700 dark:text-slate-300';

interface ProcessedSlot extends FacultySlot {
  gridSpan: number;
  classLabel: string;
  colorClass: string;
}

function formatClassLabel(section: string, semester: string): string {
  const sectionUpper = section.toUpperCase();
  return `${sectionUpper} S${semester}`;
}

export default function TeacherScheduleGrid({ schedule }: TeacherScheduleGridProps) {
  const [monochrome, setMonochrome] = useState(false);

  // Create a color map for each unique class
  const classColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueClasses = new Set<string>();
    
    for (const slot of schedule.slots) {
      uniqueClasses.add(`${slot.batch}-${slot.section}-${slot.semester}`);
    }
    
    if (monochrome) {
      Array.from(uniqueClasses).forEach((classId) => {
        map.set(classId, MONO_COLOR);
      });
    } else {
      Array.from(uniqueClasses).forEach((classId, index) => {
        map.set(classId, CLASS_COLORS[index % CLASS_COLORS.length]);
      });
    }
    
    return map;
  }, [schedule.slots, monochrome]);

  // Process schedule into a grid format
  // Group slots by day and handle overlapping/spanning slots
  const processedSchedule = useMemo(() => {
    const result: Record<DayOfWeek, (ProcessedSlot | null)[][]> = {
      Monday: Array(7).fill(null).map(() => []),
      Tuesday: Array(7).fill(null).map(() => []),
      Wednesday: Array(7).fill(null).map(() => []),
      Thursday: Array(7).fill(null).map(() => []),
      Friday: Array(7).fill(null).map(() => []),
      Saturday: Array(7).fill(null).map(() => []),
      Sunday: Array(7).fill(null).map(() => [],)
    };

    // Track which slots have been added (to avoid duplicates from span)
    const added = new Set<string>();

    for (const slot of schedule.slots) {
      const startIdx = slot.spanStart ?? slot.slotIndex;
      const endIdx = slot.spanEnd ?? slot.slotIndex;
      const key = `${slot.day}-${startIdx}-${slot.batch}-${slot.section}-${slot.semester}`;
      
      if (added.has(key)) continue;
      added.add(key);

      const classId = `${slot.batch}-${slot.section}-${slot.semester}`;
      const processed: ProcessedSlot = {
        ...slot,
        gridSpan: endIdx - startIdx + 1,
        classLabel: formatClassLabel(slot.section, slot.semester),
        colorClass: slot.isLab ? (monochrome ? MONO_LAB : LAB_COLORS) : classColorMap.get(classId) || CLASS_COLORS[0],
      };

      // Add to the starting slot
      result[slot.day][startIdx].push(processed);
    }

    return result;
  }, [schedule.slots, classColorMap]);

  // Count total classes per day
  const dailyStats = useMemo(() => {
    const stats: Record<DayOfWeek, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    
    for (const slot of schedule.slots) {
      // Only count unique slots (not spans)
      if (slot.slotIndex === (slot.spanStart ?? slot.slotIndex)) {
        stats[slot.day]++;
      }
    }
    
    return stats;
  }, [schedule.slots]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Compact Stats Bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span><strong className="text-foreground">{schedule.subjects.length}</strong> subjects</span>
        <span><strong className="text-foreground">{new Set(schedule.slots.map(s => `${s.batch}-${s.section}-${s.semester}`)).size}</strong> classes</span>
        <span><strong className="text-foreground">{schedule.slots.filter(s => s.slotIndex === (s.spanStart ?? s.slotIndex)).length}</strong> sessions/week</span>
        <span><strong className="text-foreground">{schedule.slots.filter(s => s.isLab && s.slotIndex === (s.spanStart ?? s.slotIndex)).length}</strong> labs</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:flex flex-wrap gap-1">
          {schedule.subjects.slice(0, 4).map(s => (
            <Badge key={s.code} variant="secondary" className="text-[10px] py-0 px-1.5">{s.shortName}</Badge>
          ))}
          {schedule.subjects.length > 4 && <span className="text-muted-foreground">+{schedule.subjects.length - 4}</span>}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonochrome(!monochrome)}
          className={cn("h-6 px-1.5 ml-auto", monochrome && "bg-muted")}
          title={monochrome ? "Show colors" : "Show monochrome"}
        >
          <Palette className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Schedule Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header row with time slots */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] bg-muted/50 border-b">
          <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r">
            Day
          </div>
          {THEORY_SLOTS.map((slot, idx) => (
            <div 
              key={idx}
              className="p-1 sm:p-2 text-center text-[10px] sm:text-xs text-muted-foreground border-r last:border-r-0"
            >
              <div className="font-medium">{idx + 1}</div>
              <div className="hidden sm:block text-[9px]">{slot.start}</div>
            </div>
          ))}
        </div>

        {/* Day rows */}
        {DAYS.map((day) => (
          <div 
            key={day}
            className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0 min-h-[60px]"
          >
            {/* Day label */}
            <div className="p-2 flex flex-col justify-center items-center border-r bg-muted/30">
              <span className="text-xs sm:text-sm font-medium">{DAY_ABBREV[day]}</span>
              {dailyStats[day] > 0 && (
                <span className="text-[10px] text-muted-foreground">{dailyStats[day]} cls</span>
              )}
            </div>

            {/* Slot cells */}
            {THEORY_SLOTS.map((_, slotIdx) => {
              const slotsAtPosition = processedSchedule[day][slotIdx];
              
              // Check if this slot is covered by a spanning slot from earlier
              let coveredBySpan = false;
              for (let prevIdx = 0; prevIdx < slotIdx; prevIdx++) {
                for (const prevSlot of processedSchedule[day][prevIdx]) {
                  if (prevSlot && (prevSlot.spanEnd ?? prevSlot.slotIndex) >= slotIdx) {
                    coveredBySpan = true;
                    break;
                  }
                }
                if (coveredBySpan) break;
              }
              
              if (coveredBySpan) {
                return null; // Don't render, it's part of a span
              }

              if (!slotsAtPosition || slotsAtPosition.length === 0) {
                return (
                  <div 
                    key={slotIdx}
                    className="border-r last:border-r-0 bg-background"
                  />
                );
              }

              // Calculate colspan for spanning slots
              const maxSpan = Math.max(...slotsAtPosition.map(s => s.gridSpan));
              
              return (
                <div 
                  key={slotIdx}
                  className={cn(
                    "border-r last:border-r-0 p-0.5",
                    maxSpan > 1 && `col-span-${maxSpan}`
                  )}
                  style={maxSpan > 1 ? { gridColumn: `span ${maxSpan}` } : undefined}
                >
                  <div className="flex flex-col gap-0.5 h-full">
                    {slotsAtPosition.map((slot, idx) => (
                      <Link
                        key={idx}
                        href={`/${slot.batch}/${slot.section}/${slot.semester}`}
                        className={cn(
                          "flex-1 rounded border px-1 py-0.5 transition-all hover:opacity-80 hover:shadow-sm",
                          "flex flex-col justify-center items-center text-center min-h-[40px]",
                          slot.colorClass
                        )}
                      >
                        <span className="font-semibold text-[10px] sm:text-xs leading-tight">
                          {slot.shortName}
                          {slot.isLab && <span className="text-[8px] ml-0.5">(L)</span>}
                        </span>
                        <span className="text-[8px] sm:text-[10px] opacity-75 leading-tight">
                          {slot.classLabel}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground justify-center pt-2">
        <div className="flex items-center gap-1">
          <div className={cn("w-3 h-3 rounded border", monochrome ? MONO_LAB : LAB_COLORS)} />
          <span>Lab Session</span>
        </div>
        <span className="text-muted-foreground/50">•</span>
        <span>Click on a slot to view that class&apos;s timetable</span>
      </div>
    </div>
  );
}
