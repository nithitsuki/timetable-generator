"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TimetableIndex } from '@/lib/types';
import { 
  getMyClass, 
  setMyClass,
  getFavourites,
  addFavourite,
  removeFavourite,
  isFavourite,
  formatShortLabel,
  ClassPreference,
  FavouriteClass,
} from '@/lib/preferences';

export default function BrowsePage() {
  const [index, setIndex] = useState<TimetableIndex | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [myClass, setMyClassState] = useState<ClassPreference | null>(null);
  const [favourites, setFavouritesState] = useState<FavouriteClass[]>([]);
  
  // Selection state
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');

  useEffect(() => {
    // Load preferences
    setMyClassState(getMyClass());
    setFavouritesState(getFavourites());
    
    // Fetch index
    fetch('/api/index')
      .then(res => res.json())
      .then((data: TimetableIndex) => {
        setIndex(data);
        const batches = Object.keys(data.batches).sort().reverse();
        if (batches.length > 0) {
          setSelectedBatch(batches[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load index:', err);
        setLoading(false);
      });
  }, []);

  const batches = useMemo(() => {
    return index ? Object.keys(index.batches).sort().reverse() : [];
  }, [index]);

  const sections = useMemo(() => {
    return index && selectedBatch 
      ? Object.keys(index.batches[selectedBatch] || {}).sort() 
      : [];
  }, [index, selectedBatch]);

  const semesters = useMemo(() => {
    return index && selectedBatch && selectedSection
      ? (index.batches[selectedBatch]?.[selectedSection] || [])
      : [];
  }, [index, selectedBatch, selectedSection]);

  const handleSetMyClass = (batch: string, section: string, semester: string) => {
    const pref = { batch, section, semester };
    setMyClass(pref);
    setMyClassState(pref);
  };

  const handleToggleFavourite = (batch: string, section: string, semester: string) => {
    if (isFavourite(batch, section, semester)) {
      removeFavourite(batch, section, semester);
    } else {
      addFavourite(batch, section, semester);
    }
    setFavouritesState(getFavourites());
  };

  const isMyClass = (batch: string, section: string, semester: string) => {
    return myClass?.batch === batch && myClass?.section === section && myClass?.semester === semester;
  };

  const getGradYear = (batchYear: string) => parseInt(batchYear) + 4;

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
          <h1 className="ml-4 font-semibold">All Timetables</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Favourites Section */}
        {favourites.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favourites
            </h2>
            <div className="space-y-2">
              {favourites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Link 
                    href={`/${fav.batch}/${fav.section}/${fav.semester}`}
                    className="flex-1 min-w-0"
                  >
                    <span className="font-medium">{formatShortLabel(fav.section, fav.semester)}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      Class of {getGradYear(fav.batch)}
                    </span>
                  </Link>
                  {isMyClass(fav.batch, fav.section, fav.semester) && (
                    <Badge variant="secondary" className="gap-1">
                      <Heart className="h-3 w-3 fill-current" />
                      Your Class
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleFavourite(fav.batch, fav.section, fav.semester)}
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Browse Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Browse All
          </h2>
          
          {/* Batch Selection */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {batches.map((batch) => (
                <Button
                  key={batch}
                  variant={selectedBatch === batch ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedBatch(batch);
                    setSelectedSection('');
                  }}
                >
                  {getGradYear(batch)}
                </Button>
              ))}
            </div>
          </div>

          {/* Sections Grid */}
          {selectedBatch && sections.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <Button
                    key={section}
                    variant={selectedSection === section ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSection(section)}
                  >
                    {section.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Semesters List */}
          {selectedSection && semesters.length > 0 && (
            <div className="space-y-2 mt-4">
              {semesters.map((semester) => {
                const isThis = isMyClass(selectedBatch, selectedSection, semester);
                const isFav = isFavourite(selectedBatch, selectedSection, semester);
                
                return (
                  <div
                    key={semester}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isThis && "bg-primary/5 border-primary/30"
                    )}
                  >
                    <Link 
                      href={`/${selectedBatch}/${selectedSection}/${semester}`}
                      className="flex-1"
                    >
                      <span className="font-medium">Semester {semester}</span>
                    </Link>
                    
                    {/* Set as My Class */}
                    <Button
                      variant={isThis ? "secondary" : "outline"}
                      size="sm"
                      className="gap-1"
                      onClick={() => handleSetMyClass(selectedBatch, selectedSection, semester)}
                    >
                      {isThis ? (
                        <>
                          <Check className="h-3 w-3" />
                          Your Class
                        </>
                      ) : (
                        <>
                          <Heart className="h-3 w-3" />
                          Set as Mine
                        </>
                      )}
                    </Button>
                    
                    {/* Favourite Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleFavourite(selectedBatch, selectedSection, semester)}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        isFav && "fill-yellow-500 text-yellow-500"
                      )} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Help text */}
          {!selectedSection && (
            <p className="text-sm text-muted-foreground mt-4">
              Select a batch year and section to view available semesters
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
