"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, GraduationCap, BookOpen, Users, ChevronRight, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';
import { FacultySummary, FacultySchedule } from '@/lib/types';
import { TimetablesResponse } from '@/app/api/timetables/route';
import {
  extractAllFaculty,
  buildFacultySchedule,
  filterFaculty,
  groupFacultyByLetter,
  getFirstLetter,
  stripTitle,
  TimetableEntry,
} from '@/lib/faculty-utils';

type SortOption = 'name' | 'subjects' | 'classes';
type SortDirection = 'asc' | 'desc';

export default function TeacherSchedulePage() {
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Selected faculty and their schedule
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<FacultySchedule | null>(null);

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

  // Extract faculty from timetables
  const allFaculty = useMemo(() => {
    return extractAllFaculty(timetables);
  }, [timetables]);

  // Filter and sort faculty
  const filteredFaculty = useMemo(() => {
    let result = filterFaculty(allFaculty, searchQuery);
    
    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = stripTitle(a.name).localeCompare(stripTitle(b.name));
          break;
        case 'subjects':
          comparison = a.subjectCount - b.subjectCount;
          break;
        case 'classes':
          comparison = a.classCount - b.classCount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [allFaculty, searchQuery, sortBy, sortDirection]);

  // Group by letter (only when sorted by name)
  const groupedFaculty = useMemo(() => {
    if (sortBy !== 'name' || searchQuery.trim()) {
      return null; // Don't group when not sorted by name or when searching
    }
    return groupFacultyByLetter(filteredFaculty);
  }, [filteredFaculty, sortBy, searchQuery]);

  // Handle faculty selection
  const handleSelectFaculty = (name: string) => {
    setSelectedFaculty(name);
    const schedule = buildFacultySchedule(name, timetables);
    setSelectedSchedule(schedule);
  };

  // Toggle sort
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  };

  // Go back to faculty list
  const handleBack = () => {
    setSelectedFaculty(null);
    setSelectedSchedule(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading faculty data...</p>
        </div>
      </div>
    );
  }

  // Show schedule view if a faculty is selected
  if (selectedFaculty) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg truncate">{selectedFaculty}</h1>
                <p className="text-xs text-muted-foreground">Teacher Schedule</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {selectedSchedule ? (
            <TeacherScheduleGrid schedule={selectedSchedule} />
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No schedule data found for this faculty member.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Faculty list view
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg">Teacher Schedules</h1>
              <p className="text-xs text-muted-foreground">
                {allFaculty.length} faculty member{allFaculty.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Sort */}
      <div className="container mx-auto px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        
        {/* Sort buttons */}
        <div className="flex gap-1 text-xs">
          <span className="text-muted-foreground py-1 px-1">Sort:</span>
          {[
            { key: 'name' as SortOption, label: 'Name' },
            { key: 'subjects' as SortOption, label: 'Subjects' },
            { key: 'classes' as SortOption, label: 'Classes' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={sortBy === key ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleSort(key)}
            >
              {label}
              {sortBy === key && (
                sortDirection === 'asc' 
                  ? <SortAsc className="h-3 w-3 ml-1" />
                  : <SortDesc className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Faculty List */}
      <main className="container mx-auto px-4 pb-6">
        {filteredFaculty.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No faculty found matching your search.' : 'No faculty data available.'}
            </p>
          </div>
        ) : groupedFaculty ? (
          // Grouped by letter
          <div className="space-y-3">
            {Array.from(groupedFaculty.entries())
              .sort(([a], [b]) => sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
              .map(([letter, facultyList]) => (
              <div key={letter} id={`letter-${letter}`}>
                <div className="sticky top-[108px] z-10 bg-background/95 backdrop-blur py-1 mb-1">
                  <span className="text-xs font-bold text-primary px-2">{letter}</span>
                </div>
                <div className="space-y-0.5">
                  {facultyList.map((f) => (
                    <FacultyRow 
                      key={f.name} 
                      faculty={f} 
                      onClick={() => handleSelectFaculty(f.name)} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat list
          <div className="space-y-0.5">
            {filteredFaculty.map((f) => (
              <FacultyRow 
                key={f.name} 
                faculty={f} 
                onClick={() => handleSelectFaculty(f.name)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Quick letter navigation */}
      {groupedFaculty && !searchQuery && (
        <div className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col text-[10px] font-medium text-muted-foreground z-50">
          {Array.from(groupedFaculty.keys()).sort().map(letter => (
            <button
              key={letter}
              className="px-1 py-0.5 hover:text-primary hover:bg-primary/10 rounded"
              onClick={() => {
                const el = document.getElementById(`letter-${letter}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact faculty row component
function FacultyRow({ faculty, onClick }: { faculty: FacultySummary; onClick: () => void }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer",
        "hover:bg-muted/50 active:scale-[0.99] transition-all"
      )}
      onClick={onClick}
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-xs font-semibold text-primary">
          {getFirstLetter(faculty.name)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{faculty.name}</h3>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
        <span className="flex items-center gap-0.5">
          <BookOpen className="h-3 w-3" />
          {faculty.subjectCount}
        </span>
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {faculty.classCount}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
