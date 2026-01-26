"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Calendar, Search, Users, Grid3X3, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  getMyClass, 
  getFavourites,
  formatClassLabel,
  formatShortLabel,
  ClassPreference,
} from '@/lib/preferences';

export default function HomePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // User preferences
  const [myClass, setMyClassState] = useState<ClassPreference | null>(null);
  const [favouritesCount, setFavouritesCount] = useState(0);

  // Mount check for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const saved = getMyClass();
    const favs = getFavourites();
    setMyClassState(saved);
    setFavouritesCount(favs.length);
  }, []);

  const handleYourTimetable = () => {
    if (myClass) {
      router.push(`/${myClass.batch}/${myClass.section}/${myClass.semester}`);
    } else {
      // If no class set, go to browse to set one
      router.push('/browse');
    }
  };

  const mainOptions = [
    {
      id: 'your-timetable',
      title: 'Your Timetable',
      description: myClass 
        ? formatShortLabel(myClass.section, myClass.semester)
        : 'Set up your class',
      icon: Calendar,
      color: 'bg-blue-500',
      onClick: handleYourTimetable,
      available: true,
    },
    {
      id: 'free-class',
      title: 'Free Class Finder',
      description: 'Find empty classrooms',
      icon: Search,
      color: 'bg-green-500',
      href: '/tools/free-class-finder',
      available: true,
    },
    {
      id: 'common-time',
      title: 'Common Free Time',
      description: 'Find mutual free periods',
      icon: Users,
      color: 'bg-purple-500',
      href: '/tools/common-time',
      available: true,
    },
    {
      id: 'browse',
      title: 'All Timetables',
      description: favouritesCount > 0 
        ? `${favouritesCount} favourite${favouritesCount > 1 ? 's' : ''}`
        : 'Browse & manage',
      icon: Grid3X3,
      color: 'bg-orange-500',
      href: '/browse',
      available: true,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] p-6 sm:p-8">
            <SheetHeader className="text-left pb-4 border-b">
              <SheetTitle className="text-2xl font-bold">Settings</SheetTitle>
            </SheetHeader>
            <div className="pt-6 space-y-7">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base font-semibold">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between color themes
                  </p>
                </div>
                {mounted && (
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                )}
              </div>

              {/* Your Class Info */}
              {myClass && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Class</span>
                    <span className="text-base font-medium mt-1">
                      {formatClassLabel(myClass.batch, myClass.section, myClass.semester)}
                    </span>
                  </div>
                  <Link href="/browse" className="inline-block">
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      Change Class
                    </Button>
                  </Link>
                </div>
              )}

              {/* About Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data Source</span>
                  <a 
                    href="https://github.com/amritadottown/timetable-registry" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    timetable-registry
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Timetable data is fetched from the community registry.
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Please report bugs/suggestions to{' '}
                  <a
                    href="https://www.linkedin.com/in/nithilanr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    linkedin.com/in/nithilanr
                  </a>
                  .
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
          ATU
        </h1>
        <p className="text-lg text-muted-foreground">
          Amrita Timetable Utility
        </p>
      </div>

      {/* Main Options Grid */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-4">
        {mainOptions.map((option) => {
          const Icon = option.icon;
          const content = (
            <div
              className={cn(
                "flex flex-col items-center text-center m-0 p-4 h-full rounded-2xl border bg-card hover:bg-muted/50 transition-all cursor-pointer group shadow-sm hover:shadow-md",
                "active:scale-[0.98]"
              )}
            >
              <div className="p-3 rounded-xl ">
                <Icon className="h-10 w-10 text-foreground" />
              </div>
              <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
                <h2 className="text-sm sm:text-base font-bold text-foreground mb-1 line-clamp-1 px-0">{option.title}</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-2 px-0">
                  {option.description}
                </p>
              </div>
            </div>
          );

          if (option.onClick) {
            return (
              <div key={option.id} onClick={option.onClick} className="h-40 sm:h-44">
                {content}
              </div>
            );
          }

          return (
            <Link key={option.id} href={option.href || '#'} className="block h-40 sm:h-44">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
