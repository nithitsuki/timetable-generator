"use client";
import { useState, useMemo } from 'react';
import { Timetable, DayOfWeek, parseSlotRef, resolveSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TimetableGridProps {
  timetable: Timetable;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Theory slot timings (50 min each)
const THEORY_SLOTS = [
  { start: '08:10', end: '09:00' },  // Slot 0
  { start: '09:00', end: '09:50' },  // Slot 1
  { start: '09:50', end: '10:40' },  // Slot 2
  { start: '11:00', end: '11:50' },  // Slot 3
  { start: '11:50', end: '12:40' },  // Slot 4
  { start: '14:00', end: '14:50' },  // Slot 5
  { start: '14:50', end: '15:40' },  // Slot 6
];

// Lab slot timings (2hr 15min each) - maps to schedule indices
const LAB_SLOTS: Record<string, { start: string; end: string; indices: number[] }> = {
  'morning': { start: '08:10', end: '10:25', indices: [0, 1, 2] },
  'midday': { start: '10:50', end: '13:05', indices: [3, 4] },
  'afternoon': { start: '13:25', end: '15:40', indices: [5, 6] },
};

// Day timeline boundaries
const DAY_START = '08:10';
const DAY_END = '15:40';

// Convert HH:MM to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Get percentage position on timeline
function timeToPercent(time: string): number {
  const startMin = timeToMinutes(DAY_START);
  const endMin = timeToMinutes(DAY_END);
  const currentMin = timeToMinutes(time);
  return ((currentMin - startMin) / (endMin - startMin)) * 100;
}

// Color palette for subjects
const SUBJECT_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
  'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700',
  'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700',
  'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700',
  'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700',
  'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700',
  'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700',
  'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700',
  'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700',
];

const LAB_COLORS = 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600';

// Break periods for visual display
const BREAKS = [
  { start: '10:40', end: '11:00', label: 'Tea' },
  { start: '12:40', end: '14:00', label: 'Lunch' },
];

interface ProcessedSlot {
  slotRef: string | null;
  subjectKey: string | null;
  isLab: boolean;
  startTime: string;
  endTime: string;
  startIndex: number;
  span: number;
}

export default function TimetableGrid({ timetable }: TimetableGridProps) {
  // Initialize config selections with first value of each config
  const [configSelections, setConfigSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, config] of Object.entries(timetable.config)) {
      if (config.values.length > 0) {
        initial[key] = config.values[0].id;
      }
    }
    return initial;
  });

  // Create a stable color map for subjects
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const subjectKeys = Object.keys(timetable.subjects);
    subjectKeys.forEach((key, index) => {
      map.set(key, SUBJECT_COLORS[index % SUBJECT_COLORS.length]);
    });
    return map;
  }, [timetable.subjects]);

  // Process schedule with proper time-based positioning
  const processedSchedule = useMemo(() => {
    const result: Record<DayOfWeek, ProcessedSlot[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    for (const day of DAYS) {
      const daySchedule = timetable.schedule[day] || [];
      const processed: ProcessedSlot[] = [];
      let i = 0;

      while (i < daySchedule.length) {
        const resolved = resolveSlot(daySchedule[i], timetable, configSelections);
        let span = 1;
        const startIndex = i;

        // Check for consecutive same slots (for labs)
        while (
          i + span < daySchedule.length &&
          resolveSlot(daySchedule[i + span], timetable, configSelections) === resolved &&
          resolved !== 'FREE' &&
          resolved !== null
        ) {
          span++;
        }

        const parsed = resolved ? parseSlotRef(resolved) : { subjectKey: null, isLab: false };
        const isLab = parsed.isLab; // Only check if it's explicitly marked as _LAB

        // Calculate actual time based on whether it's a lab or theory
        let startTime: string;
        let endTime: string;

        if (isLab) {
          // Find which lab slot this corresponds to based on start index
          if (startIndex <= 2) {
            startTime = LAB_SLOTS.morning.start;
            endTime = LAB_SLOTS.morning.end;
          } else if (startIndex <= 4) {
            startTime = LAB_SLOTS.midday.start;
            endTime = LAB_SLOTS.midday.end;
          } else {
            startTime = LAB_SLOTS.afternoon.start;
            endTime = LAB_SLOTS.afternoon.end;
          }
        } else {
          // Theory slot timing - use consecutive theory slots
          startTime = THEORY_SLOTS[startIndex]?.start || '08:10';
          endTime = THEORY_SLOTS[startIndex + span - 1]?.end || '15:40';
        }

        processed.push({
          slotRef: resolved,
          subjectKey: parsed.subjectKey,
          isLab,
          startTime,
          endTime,
          startIndex,
          span,
        });

        i += span;
      }

      result[day] = processed;
    }

    return result;
  }, [timetable, configSelections]);

  const handleConfigChange = (configKey: string, value: string) => {
    setConfigSelections(prev => ({ ...prev, [configKey]: value }));
  };

  // Generate time markers for the header
  const timeMarkers = useMemo(() => {
    const markers: { time: string; percent: number }[] = [];
    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    times.forEach(time => {
      const percent = timeToPercent(time);
      if (percent >= 0 && percent <= 100) {
        markers.push({ time, percent });
      }
    });
    return markers;
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Config Selectors */}
      {Object.keys(timetable.config).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          {Object.entries(timetable.config).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">
                {config.label}:
              </label>
              <select
                value={configSelections[key] || ''}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {config.values.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Time-scaled Timetable */}
      <div className="overflow-x-auto rounded-lg border border-border shadow-md bg-background">
        {/* Timeline Header */}
        <div className="flex border-b border-border">
          <div className="w-20 shrink-0 p-2 bg-muted font-semibold text-sm text-foreground flex items-center justify-center border-r border-border">
            Day
          </div>
          <div className="flex-1 relative h-12 bg-muted">
            {/* Time markers */}
            {timeMarkers.map(({ time, percent }) => (
              <div
                key={time}
                className="absolute top-0 h-full flex flex-col items-center justify-center"
                style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
              >
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
            {/* Break indicators */}
            {BREAKS.map((brk, i) => {
              const left = timeToPercent(brk.start);
              const width = timeToPercent(brk.end) - left;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 bg-muted-foreground/20 rounded flex items-center justify-center"
                  style={{ left: `${left}%`, width: `${width}%`, height: '60%' }}
                >
                  <span className="text-[10px] text-muted-foreground font-medium">{brk.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Rows */}
        {DAYS.map((day) => {
          const dayData = processedSchedule[day] || [];

          return (
            <div key={day} className="flex border-b border-border last:border-b-0">
              {/* Day label */}
              <div className="w-20 shrink-0 p-2 bg-muted/50 font-medium text-sm text-foreground flex items-center justify-center border-r border-border">
                {day.slice(0, 3)}
              </div>

              {/* Timeline with slots */}
              <div className="flex-1 relative h-16 min-h-[64px]">
                {/* Break background shading */}
                {BREAKS.map((brk, i) => {
                  const left = timeToPercent(brk.start);
                  const width = timeToPercent(brk.end) - left;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full bg-muted/50"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  );
                })}

                {/* Slot blocks */}
                {dayData.map((slot, idx) => {
                  const isEmpty = !slot.slotRef || slot.slotRef === 'FREE';
                  if (isEmpty) return null;

                  const subject = slot.subjectKey ? timetable.subjects[slot.subjectKey] : null;
                  const left = timeToPercent(slot.startTime);
                  const right = timeToPercent(slot.endTime);
                  const width = right - left;

                  const colorClass = slot.isLab
                    ? LAB_COLORS
                    : (slot.subjectKey ? subjectColorMap.get(slot.subjectKey) : '');

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "absolute top-1 bottom-1 rounded-md border-2 flex flex-col items-center justify-center overflow-hidden transition-all hover:z-10 hover:shadow-lg",
                        colorClass
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={subject ? `${subject.name}\n${slot.startTime} - ${slot.endTime}` : ''}
                    >
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate px-1">
                        {subject?.shortName || slot.slotRef}
                      </span>
                      {slot.isLab && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                          LAB
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend: Theory vs Lab slots timing */}
      <div className="mt-4 p-3 rounded-lg border border-border bg-card text-sm">
        <div className="flex flex-wrap gap-6 justify-center text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800 border border-blue-400"></div>
            <span>Theory (50 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800 border border-amber-400"></div>
            <span>Lab (2hr 15min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted-foreground/20"></div>
            <span>Break</span>
          </div>
        </div>
      </div>

      {/* Subject Legend */}
      <div className="mt-6 p-4 rounded-lg border border-border bg-card">
        <h3 className="text-lg font-semibold mb-3 text-foreground">Subjects</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(timetable.subjects).map(([key, subject]) => (
            <div 
              key={key} 
              className={cn(
                "p-3 rounded-md border-2",
                subjectColorMap.get(key)
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-foreground">{subject.shortName}</span>
                  <span className="text-xs ml-2 text-muted-foreground">({key})</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{subject.code}</span>
              </div>
              <p className="text-sm text-foreground mt-1">{subject.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {subject.faculty.join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
