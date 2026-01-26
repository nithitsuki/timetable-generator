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
import { ChevronLeft, Star, Heart } from 'lucide-react';
import Link from 'next/link';
import { 
  isFavourite, 
  toggleFavourite, 
  getMyClass,
  setMyClass,
  ClassPreference
} from '@/lib/preferences';
import { TimetableIndex } from '@/lib/types';

interface TimetableHeaderProps {
  batch: string;
  section: string;
  semester: string;
  batches: string[];
  sections: string[];
  semesters: string[];
  fullIndex?: TimetableIndex;
}

export default function TimetableHeader({
  batch,
  section,
  semester,
  batches,
  sections,
  semesters,
  fullIndex,
}: TimetableHeaderProps) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [isMyClass, setIsMyClass] = useState(false);

  useEffect(() => {
    setIsFav(isFavourite(batch, section, semester));
    const myClass = getMyClass();
    setIsMyClass(
      myClass?.batch === batch && 
      myClass?.section === section && 
      myClass?.semester === semester
    );
  }, [batch, section, semester]);

  const handleToggleFavourite = () => {
    const newState = toggleFavourite(batch, section, semester);
    setIsFav(newState);
  };

  const handleSetAsMyClass = () => {
    const pref: ClassPreference = { batch, section, semester };
    setMyClass(pref);
    setIsMyClass(true);
  };

  // Helper to find a valid route when changing selection
  const findValidSemester = (targetBatch: string, targetSection: string): string | null => {
    if (fullIndex?.batches[targetBatch]?.[targetSection]?.length) {
      const sems = fullIndex.batches[targetBatch][targetSection];
      // Try to find the same semester, otherwise use the latest
      if (sems.includes(semester)) return semester;
      return sems[sems.length - 1];
    }
    return null;
  };

  const findValidSection = (targetBatch: string): { section: string; semester: string } | null => {
    if (!fullIndex?.batches[targetBatch]) return null;
    const sectionsForBatch = Object.keys(fullIndex.batches[targetBatch]).sort();
    
    // Try to keep current section if available
    if (sectionsForBatch.includes(section)) {
      const sem = findValidSemester(targetBatch, section);
      if (sem) return { section, semester: sem };
    }
    
    // Otherwise, find first section with valid semesters
    for (const sec of sectionsForBatch) {
      const sem = findValidSemester(targetBatch, sec);
      if (sem) return { section: sec, semester: sem };
    }
    return null;
  };

  const handleBatchChange = (newBatch: string) => {
    if (fullIndex) {
      const valid = findValidSection(newBatch);
      if (valid) {
        router.push(`/${newBatch}/${valid.section}/${valid.semester}`);
        return;
      }
    }
    // Fallback to current section/semester (may fail, but better than nothing)
    router.push(`/${newBatch}/${sections[0] || section}/${semester}`);
  };

  const handleSectionChange = (newSection: string) => {
    if (fullIndex) {
      const sem = findValidSemester(batch, newSection);
      if (sem) {
        router.push(`/${batch}/${newSection}/${sem}`);
        return;
      }
    }
    // Fallback
    router.push(`/${batch}/${newSection}/${semester}`);
  };

  const handleSemesterChange = (newSemester: string) => {
    router.push(`/${batch}/${section}/${newSemester}`);
  };

  const getGradYear = (batchYear: string) => parseInt(batchYear) + 4;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Back button and title */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="shrink-0 gap-1 px-2 sm:px-3">
                <ChevronLeft className="h-5 w-5" />
                <span className="sm:hidden">Home</span>
              </Button>
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">
                {section.toUpperCase()} - Semester {semester}
              </h1>
              <p className="text-sm text-muted-foreground">
                Class of {getGradYear(batch)}
              </p>
            </div>
            
          </div>

          {/* Navigation selectors */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Select value={batch} onValueChange={handleBatchChange}>
              <SelectTrigger className="w-[90px] sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {getGradYear(b)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={section} onValueChange={handleSectionChange}>
              <SelectTrigger className="w-[90px] sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={semester} onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-[80px] sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>
                    Sem {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favourite button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavourite}
              title={isFav ? "Remove from favourites" : "Add to favourites"}
              className="shrink-0"
            >
              <Star className={`h-5 w-5 ${isFav ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </Button>

            {/* Set as my class button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSetAsMyClass}
              title={isMyClass ? "This is your class" : "Set as my class"}
              className="shrink-0"
            >
              <Heart className={`h-5 w-5 ${isMyClass ? 'fill-primary text-primary' : ''}`} />
            </Button>

            <div className="ml-2">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
