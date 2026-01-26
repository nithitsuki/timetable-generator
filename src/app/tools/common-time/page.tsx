"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Star, Heart, Plus, X } from 'lucide-react';
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
  hasBatchConfig,
  getBatchOptions,
  isClassFreeAtSlotWithConfig,
} from '@/lib/timetable-utils';
import { DayOfWeek, resolveSlot } from '@/lib/types';
import { TimetableEntry, TimetablesResponse } from '@/app/api/timetables/route';
import { getMyClass, getFavourites, ClassPreference, FavouriteClass, getClassId } from '@/lib/preferences';

// Selection state for a class
interface ClassSelection {
  year: string;
  section: string;
  semester: string;
  batch: string; // For A1/A2 type classes, empty string means 'all'
}

export default function CommonTimeFinderPage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User preferences
  const [myClass, setMyClassState] = useState<ClassPreference | null>(null);
  const [favourites, setFavouritesState] = useState<FavouriteClass[]>([]);
  
  // Multi-class selection - array of class selections
  const [selectedClasses, setSelectedClasses] = useState<ClassSelection[]>([
    { year: '', section: '', semester: '', batch: '' },
    { year: '', section: '', semester: '', batch: '' },
  ]);
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
          setSelectedClasses(prev => [
            { year: saved.batch, section: saved.section, semester: saved.semester, batch: '' },
            prev[1],
          ]);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load timetables:', err);
        setLoading(false);
      });
  }, []);
  
  // Get available years (graduation years, sorted descending - newest first)
  const availableYears = useMemo(() => {
    const years = new Set(timetables.map(t => t.batch));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [timetables]);
  
  // Get available sections for a given year
  const getSectionsForYear = (year: string) => {
    const sections = new Set(
      timetables
        .filter(t => t.batch === year)
        .map(t => t.section)
    );
    return Array.from(sections).sort();
  };
  
  // Get available semesters for a given year+section
  const getSemestersForYearSection = (year: string, section: string) => {
    const semesters = timetables
      .filter(t => t.batch === year && t.section === section)
      .map(t => t.semester);
    return Array.from(new Set(semesters)).sort((a, b) => Number(a) - Number(b));
  };
  
  // Update a class selection
  const updateClassSelection = (index: number, field: keyof ClassSelection, value: string) => {
    setSelectedClasses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'year') {
        updated[index].section = '';
        updated[index].semester = '';
        updated[index].batch = '';
      } else if (field === 'section') {
        updated[index].semester = '';
        updated[index].batch = '';
      } else if (field === 'semester') {
        updated[index].batch = '';
      }
      
      return updated;
    });
  };
  
  // Quick set a class from my class or favourites
  const quickSetClass = (index: number, batchYear: string, section: string, semester: string) => {
    setSelectedClasses(prev => {
      const updated = [...prev];
      updated[index] = { year: batchYear, section, semester, batch: '' };
      return updated;
    });
  };
  
  // Add a new class for comparison
  const addComparisonClass = () => {
    if (selectedClasses.length < 5) {
      setSelectedClasses(prev => [...prev, { year: '', section: '', semester: '', batch: '' }]);
    }
  };
  
  // Remove a class from comparison
  const removeComparisonClass = (index: number) => {
    if (selectedClasses.length > 2) {
      setSelectedClasses(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Create class options with groups (still useful for quick picks)
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

  // Get timetable entry for a selection
  const getTimetableForSelection = (selection: ClassSelection) => {
    if (!selection.year || !selection.section || !selection.semester) return undefined;
    return timetables.find(
      t => t.batch === selection.year && 
           t.section === selection.section && 
           t.semester === selection.semester
    );
  };
  
  // Get batch options for a selection (returns empty array if no batch config)
  const getBatchOptionsForSelection = (selection: ClassSelection): { label: string; id: string }[] => {
    const entry = getTimetableForSelection(selection);
    if (!entry) return [];
    if (!hasBatchConfig(entry.timetable)) return [];
    return getBatchOptions(entry.timetable);
  };
  
  // Get all selected timetables with their batch config
  const selectedTimetablesWithConfig = useMemo(() => {
    return selectedClasses
      .map((sel, index) => {
        const entry = getTimetableForSelection(sel);
        if (!entry) return null;
        return {
          entry,
          batchSelection: sel.batch, // '' means 'all batches'
          index,
        };
      })
      .filter((t): t is { entry: TimetableEntry; batchSelection: string; index: number } => t !== null);
  }, [selectedClasses, timetables]);
  
  // Get all selected timetables that are valid (for backward compatibility)
  const selectedTimetables = useMemo(() => {
    return selectedTimetablesWithConfig.map(t => t.entry);
  }, [selectedTimetablesWithConfig]);
  
  // Check if a selection is complete
  const isSelectionComplete = (sel: ClassSelection) => 
    sel.year && sel.section && sel.semester;
  
  // Count valid selections
  const validSelectionsCount = selectedClasses.filter(isSelectionComplete).length;
  
  // Check if a slot is free for a timetable with batch awareness
  const isSlotFreeWithBatch = (entry: TimetableEntry, slotIndex: number, batchSelection: string): boolean => {
    const schedule = entry.timetable.schedule[selectedDay] || [];
    if (slotIndex >= schedule.length) return true;
    
    const slotRef = schedule[slotIndex];
    
    // If it's a simple FREE slot
    if (slotRef === 'FREE' || slotRef === 'free') return true;
    
    // If timetable has batch config
    if (hasBatchConfig(entry.timetable)) {
      if (batchSelection && batchSelection !== '') {
        // Check with specific batch
        return isClassFreeAtSlotWithConfig(entry.timetable, selectedDay, slotIndex, { batch: batchSelection });
      } else {
        // Check if free for ANY batch (consider free if free in at least one batch)
        const batchOptions = getBatchOptions(entry.timetable);
        return batchOptions.some(opt => 
          isClassFreeAtSlotWithConfig(entry.timetable, selectedDay, slotIndex, { batch: opt.id })
        );
      }
    }
    
    return slotRef === 'FREE';
  };

  // Find common free slots across ALL selected timetables
  const commonFreeSlots = useMemo(() => {
    if (selectedTimetablesWithConfig.length < 2 || !selectedDay) return [];
    
    // Start with all possible slot indices
    let commonSlots = new Set([0, 1, 2, 3, 4, 5, 6]);
    
    // Intersect with free slots from each timetable
    for (const { entry, batchSelection } of selectedTimetablesWithConfig) {
      const freeSlots = new Set<number>();
      for (let i = 0; i < 7; i++) {
        if (isSlotFreeWithBatch(entry, i, batchSelection)) {
          freeSlots.add(i);
        }
      }
      // Intersection
      commonSlots = new Set([...commonSlots].filter(s => freeSlots.has(s)));
    }
    
    return Array.from(commonSlots).sort((a, b) => a - b);
  }, [selectedTimetablesWithConfig, selectedDay]);

  // Free slots per class (for display)
  const getFreeSlots = (entry: TimetableEntry, batchSelection: string): number[] => {
    const free: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (isSlotFreeWithBatch(entry, i, batchSelection)) {
        free.push(i);
      }
    }
    return free;
  };
  
  // Get free slots for each selected class
  const classFreeSlots = selectedTimetablesWithConfig.map(({ entry, batchSelection }) => ({
    timetable: entry,
    freeSlots: getFreeSlots(entry, batchSelection),
  }));

  const canCompare = validSelectionsCount >= 2;

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
          {selectedClasses.map((selection, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground">
                  {index === 0 ? 'Your class' : `Compare with ${index}`}
                </label>
                {index >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => removeComparisonClass(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Quick picks */}
              {quickPicks.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {quickPicks.map((opt) => {
                    const isSelected = selection.year === opt.entry.batch && 
                                      selection.section === opt.entry.section && 
                                      selection.semester === opt.entry.semester;
                    const isUsedElsewhere = selectedClasses.some((sel, i) => 
                      i !== index && 
                      sel.year === opt.entry.batch && 
                      sel.section === opt.entry.section && 
                      sel.semester === opt.entry.semester
                    );
                    return (
                      <Badge
                        key={opt.value}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer text-xs",
                          isUsedElsewhere && "opacity-50"
                        )}
                        onClick={() => !isUsedElsewhere && quickSetClass(
                          index, 
                          opt.entry.batch, 
                          opt.entry.section, 
                          opt.entry.semester
                        )}
                      >
                        {opt.isMyClass && <Heart className="h-3 w-3 mr-1 fill-current" />}
                        {opt.isFavourite && !opt.isMyClass && <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />}
                        {opt.shortLabel}
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Year / Section / Semester dropdowns */}
              <div className="grid grid-cols-3 gap-2">
                {/* Year (Graduation Year) */}
                <Select 
                  value={selection.year} 
                  onValueChange={(v) => updateClassSelection(index, 'year', v)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {parseInt(year) + 4}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Section */}
                <Select 
                  value={selection.section} 
                  onValueChange={(v) => updateClassSelection(index, 'section', v)}
                  disabled={!selection.year}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSectionsForYear(selection.year).map(section => (
                      <SelectItem key={section} value={section}>
                        {section.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Semester */}
                <Select 
                  value={selection.semester} 
                  onValueChange={(v) => updateClassSelection(index, 'semester', v)}
                  disabled={!selection.year || !selection.section}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSemestersForYearSection(selection.year, selection.section).map(sem => (
                      <SelectItem key={sem} value={sem}>
                        Sem {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Batch selector - only show if timetable has batch config */}
              {getBatchOptionsForSelection(selection).length > 0 && (
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Batch</label>
                  <div className="flex gap-1">
                    <Badge
                      variant={selection.batch === '' ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => updateClassSelection(index, 'batch', '')}
                    >
                      All
                    </Badge>
                    {getBatchOptionsForSelection(selection).map(opt => (
                      <Badge
                        key={opt.id}
                        variant={selection.batch === opt.id ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => updateClassSelection(index, 'batch', opt.id)}
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Add more classes button */}
          {selectedClasses.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addComparisonClass}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Class
            </Button>
          )}
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
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium whitespace-nowrap">Period</th>
                      {classFreeSlots.map((item, idx) => (
                        <th key={idx} className="text-center p-2 font-medium whitespace-nowrap">
                          {formatShortLabel(item.timetable.section, item.timetable.semester)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {THEORY_SLOTS.map((slot, slotIndex) => {
                      const allFree = classFreeSlots.every(item => 
                        item.freeSlots.includes(slotIndex)
                      );
                      
                      return (
                        <tr 
                          key={slotIndex}
                          className={cn(
                            "border-t",
                            allFree && "bg-green-50 dark:bg-green-900/20"
                          )}
                        >
                          <td className="p-2">
                            <span className="font-medium">P{slotIndex + 1}</span>
                            <span className="text-muted-foreground ml-2">{slot.start}</span>
                          </td>
                          {classFreeSlots.map((item, idx) => {
                            const isFree = item.freeSlots.includes(slotIndex);
                            return (
                              <td key={idx} className="p-2 text-center">
                                <Badge variant={isFree ? "secondary" : "outline"} className="text-xs">
                                  {isFree ? "Free" : "Busy"}
                                </Badge>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {!canCompare && validSelectionsCount === 1 && (
          <p className="text-muted-foreground text-center py-8">
            Select another class to compare
          </p>
        )}

        {validSelectionsCount === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Select at least two classes to find common free time
          </p>
        )}
      </main>
    </div>
  );
}
