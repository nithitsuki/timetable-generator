"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { 
  getMyClass, 
  setMyClass, 
  getFavourites, 
  removeFavourite,
  formatClassLabel,
  formatShortLabel,
  ClassPreference,
  FavouriteClass 
} from '@/lib/preferences';
import { Star, X, Calendar, Heart } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [index, setIndex] = useState<TimetableIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [batch, setBatch] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  
  // User preferences
  const [myClass, setMyClassState] = useState<ClassPreference | null>(null);
  const [favourites, setFavourites] = useState<FavouriteClass[]>([]);
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = getMyClass();
    const favs = getFavourites();
    setMyClassState(saved);
    setFavourites(favs);
    
    // Show setup prompt if no class is saved
    if (!saved) {
      setShowSetupPrompt(true);
    }
  }, []);

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

  const handleSaveAsMyClass = () => {
    if (batch && section && semester) {
      const pref: ClassPreference = { batch, section, semester };
      setMyClass(pref);
      setMyClassState(pref);
      setShowSetupPrompt(false);
    }
  };

  const handleRemoveFavourite = (fav: FavouriteClass) => {
    removeFavourite(fav.batch, fav.section, fav.semester);
    setFavourites(getFavourites());
  };

  // Calculate graduation year for display
  const getGradYear = (batchYear: string) => {
    return parseInt(batchYear) + 4;
  };

  // Check if a timetable exists in the index
  const timetableExists = (b: string, s: string, sem: string): boolean => {
    return index?.batches[b]?.[s]?.includes(sem) ?? false;
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
      <div className="text-center mb-6 md:mb-8 mt-8">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
          Timetable Viewer
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Select your batch, section, and semester
        </p>
      </div>

      {/* Quick Access Section - My Class & Favourites */}
      {(myClass || favourites.length > 0) && (
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Quick Access
            </h2>
            
            <div className="flex flex-wrap gap-3">
              {/* My Class Button */}
              {myClass && timetableExists(myClass.batch, myClass.section, myClass.semester) && (
                <Link href={`/${myClass.batch}/${myClass.section}/${myClass.semester}`}>
                  <Button 
                    size="lg" 
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Calendar className="h-4 w-4" />
                    View Your Timetable
                  </Button>
                </Link>
              )}
              
              {/* Favourite Classes */}
              {favourites.map((fav) => (
                timetableExists(fav.batch, fav.section, fav.semester) && (
                  <div key={fav.id} className="flex items-center gap-1">
                    <Link href={`/${fav.batch}/${fav.section}/${fav.semester}`}>
                      <Button variant="outline" size="lg" className="gap-2">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        {formatShortLabel(fav.section, fav.semester)}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFavourite(fav)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>
            
            {/* Show saved class info */}
            {myClass && (
              <p className="text-sm text-muted-foreground mt-3">
                Your class: {formatClassLabel(myClass.batch, myClass.section, myClass.semester)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Setup Prompt for First-time Users */}
      {showSetupPrompt && !myClass && (
        <div className="w-full max-w-3xl mb-8">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Set up your class
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Select your batch, section, and semester below, then click &quot;Save as My Class&quot; for quick access next time.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={() => setShowSetupPrompt(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

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

        {/* No semesters available message */}
        {sections.length > 0 && semesters.length === 0 && (
          <div className="mb-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground text-center">
              No timetables available for this section yet.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Button 
            size="lg"
            onClick={handleGo}
            disabled={!batch || !section || !semester}
            className="min-w-[200px] text-lg h-12"
          >
            View Timetable →
          </Button>
          
          {/* Save as My Class button */}
          {batch && section && semester && (
            <Button 
              size="lg"
              variant="outline"
              onClick={handleSaveAsMyClass}
              className="min-w-[200px] text-lg h-12 gap-2"
            >
              <Heart className={cn(
                "h-5 w-5",
                myClass?.batch === batch && 
                myClass?.section === section && 
                myClass?.semester === semester && "fill-primary text-primary"
              )} />
              {myClass?.batch === batch && 
               myClass?.section === section && 
               myClass?.semester === semester 
                ? "This is Your Class" 
                : "Save as My Class"}
            </Button>
          )}
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