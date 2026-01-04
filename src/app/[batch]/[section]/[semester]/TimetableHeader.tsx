"use client";
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
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface TimetableHeaderProps {
  batch: string;
  section: string;
  semester: string;
  batches: string[];
  sections: string[];
  semesters: string[];
}

export default function TimetableHeader({
  batch,
  section,
  semester,
  batches,
  sections,
  semesters,
}: TimetableHeaderProps) {
  const router = useRouter();

  const handleBatchChange = (newBatch: string) => {
    // Navigate to new batch with first available section and semester
    router.push(`/${newBatch}/${sections[0] || section}/${semester}`);
  };

  const handleSectionChange = (newSection: string) => {
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
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
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

            <div className="ml-2">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
