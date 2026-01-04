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
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-6">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* Header */}
      <div className="text-center mb-8 md:mb-12 mt-8">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          Timetable Viewer
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-4">
          Select your batch, section, and semester
        </p>
        {/* Quick access to current selection */}
        {batch && section && semester && (
          <Button 
            variant="outline" 
            onClick={handleGo}
            className="mt-2"
          >
            📅 Quick View: {batch} {section.toUpperCase()} - Sem {semester}
          </Button>
        )}
      </div>

      {/* Selection Area */}
      <div className="w-full max-w-5xl">
        {/* Batch Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            Batch (Graduation Year)
          </h2>
          <div className="flex flex-wrap gap-2">
            {batches.map((b) => (
              <Button
                key={b}
                variant={batch === b ? "default" : "outline"}
                onClick={() => handleBatchChange(b)}
                className={cn(
                  "min-w-[120px]",
                  batch === b && "ring-2 ring-primary"
                )}
              >
                Class of {getGradYear(b)}
              </Button>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        {sections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Section
            </h2>
            {sections.length <= 15 ? (
              <div className="flex flex-wrap gap-2">
                {sections.map((s) => (
                  <Button
                    key={s}
                    variant={section === s ? "default" : "outline"}
                    onClick={() => handleSectionChange(s)}
                    className={cn(
                      "min-w-[80px]",
                      section === s && "ring-2 ring-primary"
                    )}
                  >
                    {s.toUpperCase()}
                  </Button>
                ))}
              </div>
            ) : (
              <Select value={section} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-full max-w-sm">
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
            )}
          </div>
        )}

        {/* Semester Selection */}
        {semesters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
              Semester
            </h2>
            <div className="flex flex-wrap gap-2">
              {semesters.map((s) => (
                <Button
                  key={s}
                  variant={semester === s ? "default" : "outline"}
                  onClick={() => handleSemesterChange(s)}
                  className={cn(
                    "min-w-[100px]",
                    semester === s && "ring-2 ring-primary"
                  )}
                >
                  Semester {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* View Button */}
        <div className="flex justify-center mt-8">
          <Button 
            size="lg"
            onClick={handleGo}
            disabled={!batch || !section || !semester}
            className="min-w-[200px] text-lg h-12"
          >
            View Timetable →
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-12 pb-4 text-center text-sm text-muted-foreground">
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