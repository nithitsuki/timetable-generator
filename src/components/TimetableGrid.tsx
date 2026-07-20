"use client";
import { useState, useMemo, useEffect } from 'react';
import { Timetable, DayOfWeek, parseSlotRef, resolveSlot } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Calendar, Check, Share2, ChevronDown, ChevronUp, Copy, Download, Link, Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimetableGridProps {
  timetable: Timetable;
  batch?: string;
  section?: string;
  semester?: string;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
const MONO_COLOR = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600';
const MONO_LAB = 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500';

// Break periods for visual display
const BREAKS = [
  { start: '10:40', end: '11:00', label: 'Tea' },
  { start: '12:40', end: '14:00', label: 'Lunch' },
];

// Cross-browser clipboard copy with fallback
async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback: create temporary textarea and use execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

interface ProcessedSlot {
  slotRef: string | null;
  subjectKey: string | null;
  isLab: boolean;
  startTime: string;
  endTime: string;
  startIndex: number;
  span: number;
}

export default function TimetableGrid({ timetable, batch, section, semester }: TimetableGridProps) {
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

  // Compact view for mobile - default to false initially to match server
  const [isCompactView, setIsCompactView] = useState(false);
  
  // Collapsible subjects card - default expanded on desktop, collapsed on mobile
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true);

  // Monochrome mode toggle
  const [monochrome, setMonochrome] = useState(false);

  // Set default based on screen size on mount
  useEffect(() => {
    // Check if mobile (<640px)
    if (window.innerWidth < 640) {
      setIsCompactView(true);
      setIsSubjectsExpanded(false);
    }
  }, []);

  // Current time for the time indicator line
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [currentDayName, setCurrentDayName] = useState<string | null>(null);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
      setCurrentDayName(DAY_NAMES[now.getDay()]);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Create a stable color map for subjects
  const subjectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const subjectKeys = Object.keys(timetable.subjects);
    subjectKeys.forEach((key, index) => {
      map.set(key, monochrome ? MONO_COLOR : SUBJECT_COLORS[index % SUBJECT_COLORS.length]);
    });
    return map;
  }, [timetable.subjects, monochrome]);

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

  // Calculate current time position percentage
  const currentTimePercent = useMemo(() => {
    if (!currentTime) return null;
    const percent = timeToPercent(currentTime);
    // Only show if within timeline bounds
    if (percent >= 0 && percent <= 100) {
      return percent;
    }
    return null;
  }, [currentTime]);
  
  // Generate ICS download URL
  const icsUrl = useMemo(() => {
    if (!batch || !section || !semester) return null;
    
    const baseUrl = `https://timetable-registry.amrita.town/ics/${batch}/${section}/${semester}`;
    const params = new URLSearchParams();
    
    // Add config selections as query params
    for (const [key, value] of Object.entries(configSelections)) {
      if (value) {
        params.append(key, value);
      }
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [batch, section, semester, configSelections]);
  
  // State for copy feedback
  const [icsCopied, setIcsCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  
  const handleCopyIcsLink = async () => {
    if (icsUrl) {
      const success = await copyToClipboard(icsUrl);
      if (success) {
        setIcsCopied(true);
        setTimeout(() => setIcsCopied(false), 2000);
      } else {
        // Fallback: open in new tab if clipboard fails
        window.open(icsUrl, '_blank');
      }
    }
  };
  
  const handleShare = async () => {
    const url = window.location.href;
    const title = `Timetable - ${section?.toUpperCase() || ''} Sem ${semester || ''}`;
    
    // Try native share API first (works on mobile)
    if (navigator?.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    
    // Fallback to clipboard
    const success = await copyToClipboard(url);
    if (success) {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Toolbar row - all controls in one row */}
      <div className="mb-3 flex items-center gap-2">
        {/* Left side: View toggle (mobile only) */}
        <button
          onClick={() => setIsCompactView(!isCompactView)}
          className="sm:hidden flex items-center justify-center h-9 w-9 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors"
          title={isCompactView ? "Detailed view" : "Compact view"}
        >
          {isCompactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </button>
        
        {/* Config Selectors - inline, no label on mobile */}
        {Object.keys(timetable.config).length > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Object.entries(timetable.config).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 min-w-0 flex-1">
                <label className="hidden sm:block text-sm font-medium text-foreground whitespace-nowrap">
                  {config.label}:
                </label>
                <select
                  value={configSelections[key] || ''}
                  onChange={(e) => handleConfigChange(key, e.target.value)}
                  className="flex-1 min-w-0 h-9 px-2 sm:px-3 rounded-md border border-input bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        
        {/* Spacer when no config */}
        {Object.keys(timetable.config).length === 0 && <div className="flex-1" />}
        
        {/* Monochrome toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonochrome(!monochrome)}
          className={cn("h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2", monochrome && "bg-muted")}
          title={monochrome ? "Show colors" : "Show monochrome"}
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">{monochrome ? "B&W" : "Color"}</span>
        </Button>
        
        {/* Right side: Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* ICS Export Popover */}
          {icsUrl && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 sm:w-auto sm:px-3 p-0 sm:p-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">ICS</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Calendar Subscription</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add this timetable to your calendar app (Google Calendar, Apple Calendar, etc.)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={icsUrl}
                      className="h-8 text-xs font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      onClick={async () => {
                        const success = await copyToClipboard(icsUrl);
                        if (success) {
                          setIcsCopied(true);
                          setTimeout(() => setIcsCopied(false), 2000);
                        }
                      }}
                    >
                      {icsCopied ? (
                        <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> Copied!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => window.open(icsUrl, '_blank')}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {/* Share Popover - hidden on mobile, use native share instead */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-9 px-3"
              >
                <Share2 className="h-4 w-4" />
                <span className="ml-1.5">Share</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Share Timetable</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share this timetable link with others
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="h-8 text-xs font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full h-8"
                  onClick={async () => {
                    const success = await copyToClipboard(window.location.href);
                    if (success) {
                      setUrlCopied(true);
                      setTimeout(() => setUrlCopied(false), 2000);
                    }
                  }}
                >
                  {urlCopied ? (
                    <><Check className="h-3.5 w-3.5 mr-1.5 text-green-500" /> Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link</>
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Time-scaled Timetable */}
      <div className={cn(
        "rounded-lg border border-border shadow-md bg-background",
        isCompactView ? "overflow-hidden" : "overflow-x-auto"
      )}>
        {/* Timeline Header */}
        <div className={cn(
          "flex border-b border-border",
          isCompactView ? "" : "min-w-[600px]"
        )}>
          <div className={cn(
            "shrink-0 p-2 bg-muted font-semibold text-foreground flex items-center justify-center border-r border-border",
            isCompactView ? "w-10 text-xs" : "w-16 md:w-20 text-sm"
          )}>
            Day
          </div>
          <div className={cn(
            "flex-1 relative bg-muted",
            isCompactView ? "h-8" : "h-10 md:h-12"
          )}>
            {/* Time markers */}
            {timeMarkers.map(({ time, percent }) => (
              <div
                key={time}
                className="absolute top-0 h-full flex flex-col items-center justify-center"
                style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
              >
                <span className={cn(
                  "text-muted-foreground whitespace-nowrap",
                  isCompactView ? "text-[8px]" : "text-[10px] md:text-xs"
                )}>{isCompactView ? time.slice(0, 2) : time}</span>
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
                  <span className={cn(
                    "text-muted-foreground font-medium",
                    isCompactView ? "text-[6px]" : "text-[8px] md:text-[10px]"
                  )}>{isCompactView ? brk.label[0] : brk.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Rows */}
        {DAYS.map((day) => {
          const dayData = processedSchedule[day] || [];
          const isCurrentDay = currentDayName === day;

          return (
            <div key={day} className={cn(
              "flex border-b border-border last:border-b-0",
              isCompactView ? "" : "min-w-[600px]"
            )}>
              {/* Day label */}
              <div className={cn(
                "shrink-0 p-2 bg-muted/50 font-medium text-foreground flex items-center justify-center border-r border-border",
                isCompactView ? "w-10 text-xs" : "w-16 md:w-20 text-sm",
                isCurrentDay && (monochrome ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900/30")
              )}>
                {isCompactView ? day.slice(0, 1) : day.slice(0, 3)}
              </div>

              {/* Timeline with slots */}
              <div className={cn(
                "flex-1 relative",
                isCompactView ? "h-10 min-h-[40px]" : "h-14 md:h-16 min-h-[56px] md:min-h-[64px]"
              )}>
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

                {/* Current time indicator line */}
                {isCurrentDay && currentTimePercent !== null && (
                  <div
                    className={cn("absolute top-0 h-full w-0.5 z-20", monochrome ? "bg-slate-500" : "bg-blue-500")}
                    style={{ left: `${currentTimePercent}%` }}
                  >
                    <div className={cn("absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full", monochrome ? "bg-slate-500" : "bg-blue-500")} />
                  </div>
                )}

                {/* Slot blocks */}
                {dayData.map((slot, idx) => {
                  const isEmpty = !slot.slotRef || slot.slotRef === 'FREE';
                  if (isEmpty) return null;

                  const subject = slot.subjectKey ? timetable.subjects[slot.subjectKey] : null;
                  const left = timeToPercent(slot.startTime);
                  const right = timeToPercent(slot.endTime);
                  const width = right - left;

                  const colorClass = slot.isLab
                    ? (monochrome ? MONO_LAB : LAB_COLORS)
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
                      <span className={cn(
                        "font-semibold text-foreground truncate px-1",
                        isCompactView ? "text-[8px]" : "text-xs sm:text-sm"
                      )}>
                        {subject?.shortName || slot.slotRef}
                      </span>
                      {slot.isLab && !isCompactView && (
                        <span className={cn("text-[10px] px-1 py-0.5 rounded", monochrome ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300" : "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100")}>
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
            <div className={cn("w-3 h-3 rounded border", monochrome ? "bg-slate-200 dark:bg-slate-700 border-slate-400" : "bg-blue-200 dark:bg-blue-800 border-blue-400")}></div>
            <span>Theory (50 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded border", monochrome ? "bg-slate-200 dark:bg-slate-700 border-slate-400" : "bg-amber-200 dark:bg-amber-800 border-amber-400")}></div>
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
        <button
          onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-foreground">Subjects</h3>
          {isSubjectsExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        {isSubjectsExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
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
        )}
      </div>
    </div>
  );
}
