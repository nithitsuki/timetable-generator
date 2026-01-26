"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  THEORY_SLOTS, 
  LAB_SLOTS,
  DAYS, 
  getDayOfWeek, 
  getCurrentSlotIndex,
  isClassFreeAtSlot,
  getSubjectAtSlot,
  formatShortLabel,
} from '@/lib/timetable-utils';
import { TimetableEntry, TimetablesResponse } from '@/app/api/timetables/route';

export default function FreeClassFinderPage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date and time selection - defaults to NOW
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  // Lab slot selection - separate from theory slot
  // null = no lab slot selected, 0/1/2 = morning/midday/afternoon
  const [selectedLabSlot, setSelectedLabSlot] = useState<number | null>(null);
  const [justNoLab, setJustNoLab] = useState(false);

  // Fetch all timetables on mount
  useEffect(() => {
    fetch('/api/timetables')
      .then(res => res.json())
      .then((data: TimetablesResponse) => {
        setTimetables(data.timetables);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load timetables:', err);
        setLoading(false);
      });
  }, []);

  // Auto-detect current slot on mount
  useEffect(() => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const slot = getCurrentSlotIndex(time);
    setSelectedSlot(slot ?? 0); // Default to first slot if outside hours
  }, []);

  // Get day of week from selected date
  const dayOfWeek = useMemo(() => {
    return getDayOfWeek(selectedDate);
  }, [selectedDate]);

  // Get which theory slots are equivalent to a lab slot
  const getEquivalentTheorySlots = (labIndex: number): number[] => {
    return LAB_SLOTS[labIndex]?.indices || [];
  };

  // Check if a theory slot should be highlighted (equivalent to selected lab)
  const isTheoryHighlighted = (theoryIndex: number): boolean => {
    if (selectedLabSlot === null) return false;
    return getEquivalentTheorySlots(selectedLabSlot).includes(theoryIndex);
  };

  // Check if a slot is a lab for a class (lab-only check)
  const isLabAtSlot = useCallback((entry: TimetableEntry, day: typeof dayOfWeek, slotIndex: number): boolean => {
    if (!day) return false;
    const subject = getSubjectAtSlot(entry.timetable, day, slotIndex);
    return subject?.isLab === true;
  }, []);

  // Find free classes based on selection mode
  // If lab slot is selected: check that ALL equivalent theory slots are free
  // If only theory slot selected: check just that slot
  const freeClasses = useMemo(() => {
    if (!dayOfWeek) return [];
    if (!DAYS.includes(dayOfWeek)) return [];
    
    // Lab slot mode: either check lab-only or all equivalent theory slots are free
    if (selectedLabSlot !== null) {
      const equivalentSlots = getEquivalentTheorySlots(selectedLabSlot);
      
      return timetables.filter(entry => {
        if (justNoLab) {
          // Must NOT have lab in any equivalent slot (theory allowed)
          return equivalentSlots.every(slotIdx => !isLabAtSlot(entry, dayOfWeek, slotIdx));
        }
        // Must be free in ALL equivalent theory slots
        return equivalentSlots.every(slotIdx => 
          isClassFreeAtSlot(entry.timetable, dayOfWeek, slotIdx)
        );
      }).map(entry => ({
        ...entry,
        shortLabel: formatShortLabel(entry.section, entry.semester),
      }));
    }
    
    // Theory slot mode: check just that slot
    if (selectedSlot === null) return [];
    
    return timetables.filter(entry => {
      return isClassFreeAtSlot(entry.timetable, dayOfWeek, selectedSlot);
    }).map(entry => ({
      ...entry,
      shortLabel: formatShortLabel(entry.section, entry.semester),
    }));
  }, [timetables, dayOfWeek, selectedSlot, selectedLabSlot, justNoLab, isLabAtSlot]);

  // Classes that are busy
  const busyClasses = useMemo(() => {
    if (!dayOfWeek) return [];
    if (!DAYS.includes(dayOfWeek)) return [];
    
    // Lab slot mode
    if (selectedLabSlot !== null) {
      const equivalentSlots = getEquivalentTheorySlots(selectedLabSlot);
      
      return timetables.filter(entry => {
        if (justNoLab) {
          // Has a lab in any equivalent slot
          return equivalentSlots.some(slotIdx => isLabAtSlot(entry, dayOfWeek, slotIdx));
        }
        // Has class in ANY of the equivalent theory slots
        return !equivalentSlots.every(slotIdx => 
          isClassFreeAtSlot(entry.timetable, dayOfWeek, slotIdx)
        );
      }).map(entry => {
        // Find first occupied slot to show what subject
        const occupiedSlot = justNoLab
          ? equivalentSlots.find(slotIdx => isLabAtSlot(entry, dayOfWeek, slotIdx))
          : equivalentSlots.find(slotIdx => !isClassFreeAtSlot(entry.timetable, dayOfWeek, slotIdx));
        const subject = occupiedSlot !== undefined 
          ? getSubjectAtSlot(entry.timetable, dayOfWeek, occupiedSlot)
          : null;
        return {
          ...entry,
          shortLabel: formatShortLabel(entry.section, entry.semester),
          subject,
        };
      });
    }
    
    // Theory slot mode
    if (selectedSlot === null) return [];
    
    return timetables.filter(entry => {
      return !isClassFreeAtSlot(entry.timetable, dayOfWeek, selectedSlot);
    }).map(entry => {
      const subject = getSubjectAtSlot(entry.timetable, dayOfWeek, selectedSlot);
      return {
        ...entry,
        shortLabel: formatShortLabel(entry.section, entry.semester),
        subject,
      };
    });
  }, [timetables, dayOfWeek, selectedSlot, selectedLabSlot, justNoLab, isLabAtSlot]);

  const isWeekend = dayOfWeek && !DAYS.includes(dayOfWeek);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="ml-4 font-semibold">Free Class Finder</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Date & Slot Selection */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "EEE, MMM d")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Now Button */}
          <Button 
            variant="outline" 
            onClick={() => {
              const now = new Date();
              setSelectedDate(now);
              const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
              setSelectedSlot(getCurrentSlotIndex(time) ?? 0);
              setSelectedLabSlot(null);
              setJustNoLab(false);
            }}
          >
            <Clock className="h-4 w-4 mr-2" />
            Now
          </Button>
        </div>

        {/* Period Selection */}
        {!isWeekend && (
          <div className="mb-8 space-y-6">
            {/* Theory Periods */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Theory Periods (50 min)</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {THEORY_SLOTS.map((slot, index) => {
                  const isSelected = selectedSlot === index && selectedLabSlot === null;
                  const isHighlighted = isTheoryHighlighted(index);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSlot(index);
                        setSelectedLabSlot(null); // Clear lab selection when picking theory
                      }}
                      className={`
                        flex flex-col items-center p-3 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : isHighlighted
                            ? 'border-amber-400 bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <span className="text-lg font-semibold">P{index + 1}</span>
                      <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                        {slot.start}
                      </span>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {slot.end}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lab Periods */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Lab Slots (2hr 15min)</p>
                <div className="flex items-center gap-2">
                  <Switch
                    id="just-no-lab"
                    checked={justNoLab}
                    onCheckedChange={setJustNoLab}
                  />
                  <Label htmlFor="just-no-lab" className="text-xs text-muted-foreground">
                    Just no lab
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LAB_SLOTS.map((lab, index) => {
                  const isSelected = selectedLabSlot === index;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedLabSlot(index);
                        setSelectedSlot(null); // Clear theory selection when picking lab
                      }}
                      className={`
                        flex flex-col p-3 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400' 
                          : 'border-border hover:border-amber-500/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium capitalize">{lab.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {lab.start} – {lab.end}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isWeekend ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                It&apos;s {dayOfWeek}! No classes 🎉
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Free Classes */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                Free ({freeClasses.length})
              </h2>
              {freeClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {freeClasses.map((entry) => (
                    <Link 
                      key={`${entry.batch}-${entry.section}-${entry.semester}`}
                      href={`/${entry.batch}/${entry.section}/${entry.semester}`}
                    >
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 text-sm py-1.5 px-3"
                      >
                        {entry.shortLabel}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No free classes at this time</p>
              )}
            </section>

            {/* Occupied Classes */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Occupied ({busyClasses.length})
              </h2>
              {busyClasses.length > 0 ? (
                <div className="space-y-1">
                  {busyClasses.map((entry) => (
                    <Link 
                      key={`${entry.batch}-${entry.section}-${entry.semester}`}
                      href={`/${entry.batch}/${entry.section}/${entry.semester}`}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm">{entry.shortLabel}</span>
                      {entry.subject && (
                        <Badge variant="outline" className="text-xs">
                          {entry.subject.shortName}
                          {entry.subject.isLab && " Lab"}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">All classes are free!</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
