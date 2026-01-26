"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { 
  THEORY_SLOTS, 
  DAYS, 
  findCommonFreeSlots,
  formatClassLabel,
  formatShortLabel,
  formatSlotTime,
} from '@/lib/timetable-utils';
import { DayOfWeek } from '@/lib/types';
import { TimetableEntry, TimetablesResponse } from '@/app/api/timetables/route';
import { getMyClass, getFavourites, ClassPreference, FavouriteClass, getClassId } from '@/lib/preferences';

export default function CommonTimeFinderPage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User preferences
  const [myClass, setMyClassState] = useState<ClassPreference | null>(null);
  const [favourites, setFavouritesState] = useState<FavouriteClass[]>([]);
  
  // Selection state
  const [class1, setClass1] = useState<string>('');
  const [class2, setClass2] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');

  // Load preferences and timetables
  useEffect(() => {
    const saved = getMyClass();
    const favs = getFavourites();
    setMyClassState(saved);
    setFavouritesState(favs);
    
    fetch('/api/timetables')
      .then(res => res.json())
      .then((data: TimetablesResponse) => {
        setTimetables(data.timetables);
        
        // Auto-select user's class as first class
        if (saved) {
          setClass1(`${saved.batch}/${saved.section}/${saved.semester}`);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load timetables:', err);
        setLoading(false);
      });
  }, []);

  // Create class options with groups
  const classOptions = useMemo(() => {
    const myClassId = myClass ? getClassId(myClass.batch, myClass.section, myClass.semester) : null;
    const favIds = new Set(favourites.map(f => f.id));
    
    const options = timetables.map(entry => {
      const id = getClassId(entry.batch, entry.section, entry.semester);
      return {
        value: `${entry.batch}/${entry.section}/${entry.semester}`,
        label: formatClassLabel(entry.batch, entry.section, entry.semester),
        shortLabel: formatShortLabel(entry.section, entry.semester),
        isMyClass: id === myClassId,
        isFavourite: favIds.has(id),
        entry,
      };
    });
    
    return options;
  }, [timetables, myClass, favourites]);

  // Quick pick options (my class + favourites)
  const quickPicks = useMemo(() => {
    return classOptions.filter(opt => opt.isMyClass || opt.isFavourite);
  }, [classOptions]);

  // Get selected timetables
  const selectedTimetable1 = useMemo(() => {
    return classOptions.find(opt => opt.value === class1)?.entry;
  }, [class1, classOptions]);

  const selectedTimetable2 = useMemo(() => {
    return classOptions.find(opt => opt.value === class2)?.entry;
  }, [class2, classOptions]);

  // Find common free slots
  const commonFreeSlots = useMemo(() => {
    if (!selectedTimetable1 || !selectedTimetable2 || !selectedDay) return [];
    return findCommonFreeSlots(
      selectedTimetable1.timetable,
      selectedTimetable2.timetable,
      selectedDay
    );
  }, [selectedTimetable1, selectedTimetable2, selectedDay]);

  // Free slots per class
  const getFreeSlots = (timetable: TimetableEntry | undefined) => {
    if (!timetable) return [];
    const schedule = timetable.timetable.schedule[selectedDay] || [];
    const free: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (i >= schedule.length || schedule[i] === 'FREE') {
        free.push(i);
      }
    }
    return free;
  };

  const class1FreeSlots = getFreeSlots(selectedTimetable1);
  const class2FreeSlots = getFreeSlots(selectedTimetable2);

  const canCompare = class1 && class2 && class1 !== class2;

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
          <h1 className="ml-4 font-semibold">Common Free Time</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Class Selection */}
        <div className="space-y-4 mb-6">
          {/* First Class */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Your class</label>
            <Select value={class1} onValueChange={setClass1}>
              <SelectTrigger>
                <SelectValue placeholder="Select class..." />
              </SelectTrigger>
              <SelectContent>
                {quickPicks.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> Quick Pick
                    </SelectLabel>
                    {quickPicks.map((opt) => (
                      <SelectItem 
                        key={opt.value} 
                        value={opt.value}
                        disabled={opt.value === class2}
                      >
                        <span className="flex items-center gap-2">
                          {opt.isMyClass && <Heart className="h-3 w-3 fill-current text-primary" />}
                          {opt.isFavourite && !opt.isMyClass && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                          {opt.shortLabel}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                <SelectGroup>
                  <SelectLabel>All Classes</SelectLabel>
                  {classOptions.map((opt) => (
                    <SelectItem 
                      key={opt.value} 
                      value={opt.value}
                      disabled={opt.value === class2}
                    >
                      {opt.shortLabel}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Second Class */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Compare with</label>
            
            {/* Quick pick badges */}
            {quickPicks.filter(p => p.value !== class1).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {quickPicks.filter(p => p.value !== class1).map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={class2 === opt.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setClass2(opt.value)}
                  >
                    {opt.isMyClass && <Heart className="h-3 w-3 mr-1 fill-current" />}
                    {opt.isFavourite && !opt.isMyClass && <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />}
                    {opt.shortLabel}
                  </Badge>
                ))}
              </div>
            )}
            
            <Select value={class2} onValueChange={setClass2}>
              <SelectTrigger>
                <SelectValue placeholder="Select class to compare..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>All Classes</SelectLabel>
                  {classOptions.map((opt) => (
                    <SelectItem 
                      key={opt.value} 
                      value={opt.value}
                      disabled={opt.value === class1}
                    >
                      {opt.shortLabel}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Day Selection */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-2 block">Day</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {canCompare && (
          <div className="space-y-6">
            {/* Common Free Slots */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Common Free Periods ({commonFreeSlots.length})
              </h2>
              {commonFreeSlots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {commonFreeSlots.map((slotIndex) => (
                    <div 
                      key={slotIndex}
                      className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700"
                    >
                      <span className="font-medium text-green-700 dark:text-green-300">
                        P{slotIndex + 1}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                        {formatSlotTime(slotIndex)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No common free periods on {selectedDay}</p>
              )}
            </section>

            {/* Comparison Table */}
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Period Comparison
              </h2>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Period</th>
                      <th className="text-center p-2 font-medium">
                        {classOptions.find(o => o.value === class1)?.shortLabel}
                      </th>
                      <th className="text-center p-2 font-medium">
                        {classOptions.find(o => o.value === class2)?.shortLabel}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {THEORY_SLOTS.map((slot, index) => {
                      const is1Free = class1FreeSlots.includes(index);
                      const is2Free = class2FreeSlots.includes(index);
                      const bothFree = is1Free && is2Free;
                      
                      return (
                        <tr 
                          key={index}
                          className={cn(
                            "border-t",
                            bothFree && "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <td className="p-2">
                            <span className="font-medium">P{index + 1}</span>
                            <span className="text-muted-foreground ml-2">{slot.start}</span>
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={is1Free ? "secondary" : "outline"} className="text-xs">
                              {is1Free ? "Free" : "Busy"}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <Badge variant={is2Free ? "secondary" : "outline"} className="text-xs">
                              {is2Free ? "Free" : "Busy"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {!canCompare && class1 && (
          <p className="text-muted-foreground text-center py-8">
            Select another class to compare
          </p>
        )}

        {!class1 && (
          <p className="text-muted-foreground text-center py-8">
            Select two classes to find common free time
          </p>
        )}
      </main>
    </div>
  );
}
