"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, GraduationCap, BookOpen, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';
import { FacultySummary, FacultySchedule } from '@/lib/faculty';

export default function TeacherSchedulePage() {
  const [faculty, setFaculty] = useState<FacultySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected faculty and their schedule
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<FacultySchedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Fetch all faculty on mount
  useEffect(() => {
    fetch('/api/faculty')
      .then(res => res.json())
      .then(data => {
        setFaculty(data.faculty || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load faculty:', err);
        setLoading(false);
      });
  }, []);

  // Filter faculty based on search
  const filteredFaculty = useMemo(() => {
    if (!searchQuery.trim()) return faculty;
    const query = searchQuery.toLowerCase();
    return faculty.filter(f => f.name.toLowerCase().includes(query));
  }, [faculty, searchQuery]);

  // Load schedule for selected faculty
  const handleSelectFaculty = async (name: string) => {
    setSelectedFaculty(name);
    setLoadingSchedule(true);
    
    try {
      const res = await fetch(`/api/faculty?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setSelectedSchedule(data.schedule);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setSelectedSchedule(null);
    } finally {
      setLoadingSchedule(false);
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
        {/* Header */}
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

        {/* Main content */}
        <main className="container mx-auto px-4 py-6">
          {loadingSchedule ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading schedule...</p>
              </div>
            </div>
          ) : selectedSchedule ? (
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
      {/* Header */}
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
                {faculty.length} faculty member{faculty.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search faculty by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
        ) : (
          <div className="space-y-2">
            {filteredFaculty.map((f) => (
              <Card 
                key={f.name}
                className={cn(
                  "cursor-pointer transition-all hover:bg-muted/50",
                  "active:scale-[0.99]"
                )}
                onClick={() => handleSelectFaculty(f.name)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{f.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {f.subjectCount} subject{f.subjectCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {f.classCount} class{f.classCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
