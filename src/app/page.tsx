"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModeToggle from '@/components/comp-130';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { TimetableIndex } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [index, setIndex] = useState<TimetableIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [batch, setBatch] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [semester, setSemester] = useState<string>('');

  // Fetch the timetable index
  useEffect(() => {
    fetch('/api/index')
      .then(res => res.json())
      .then((data: TimetableIndex) => {
        setIndex(data);
        // Set defaults to the most recent/first available
        const batches = Object.keys(data.batches).sort().reverse();
        if (batches.length > 0) {
          const defaultBatch = batches[0];
          setBatch(defaultBatch);
          
          const sections = Object.keys(data.batches[defaultBatch]).sort();
          if (sections.length > 0) {
            const defaultSection = sections[0];
            setSection(defaultSection);
            
            const semesters = data.batches[defaultBatch][defaultSection];
            if (semesters.length > 0) {
              setSemester(semesters[semesters.length - 1]); // Latest semester
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load index:', err);
        setError('Failed to load timetable index');
        setLoading(false);
      });
  }, []);

  const batches = index ? Object.keys(index.batches).sort().reverse() : [];
  const sections = index && batch ? Object.keys(index.batches[batch] || {}).sort() : [];
  const semesters = index && batch && section ? (index.batches[batch]?.[section] || []) : [];

  const handleBatchChange = (value: string) => {
    setBatch(value);
    const newSections = Object.keys(index?.batches[value] || {}).sort();
    if (newSections.length > 0) {
      setSection(newSections[0]);
      const newSemesters = index?.batches[value]?.[newSections[0]] || [];
      setSemester(newSemesters[newSemesters.length - 1] || '');
    } else {
      setSection('');
      setSemester('');
    }
  };

  const handleSectionChange = (value: string) => {
    setSection(value);
    const newSemesters = index?.batches[batch]?.[value] || [];
    setSemester(newSemesters[newSemesters.length - 1] || '');
  };

  const handleSemesterChange = (value: string) => {
    setSemester(value);
  };

  const handleGo = () => {
    if (batch && section && semester) {
      router.push(`/${batch}/${section}/${semester}`);
    }
  };

  // Calculate graduation year for display
  const getGradYear = (batchYear: string) => {
    return parseInt(batchYear) + 4;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20"></div>
          <p className="text-muted-foreground">Loading timetables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-6">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Header */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          Timetable Viewer
        </h1>
        <p className="text-lg text-muted-foreground">
          Select your batch, section, and semester to view your timetable
        </p>
      </div>

      {/* Selection Card */}
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-6">
        <div className="space-y-4">
          {/* Batch Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Batch (Graduation Year)</label>
            <Select value={batch} onValueChange={handleBatchChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    Class of {getGradYear(b)} ({b} batch)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Section</label>
            <Select value={section} onValueChange={handleSectionChange} disabled={!sections.length}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Semester</label>
            <Select value={semester} onValueChange={handleSemesterChange} disabled={!semesters.length}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>
                    Semester {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Go Button */}
          <Button 
            className="w-full mt-4" 
            size="lg"
            onClick={handleGo}
            disabled={!batch || !section || !semester}
          >
            View Timetable
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 pb-4 text-center text-sm text-muted-foreground">
        <p>
          Data from{' '}
          <a 
            href="https://github.com/amritadottown/timetable-registry" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            timetable-registry
          </a>
        </p>
      </footer>
    </div>
  );
}