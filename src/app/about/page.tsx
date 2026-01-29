"use client";
import Link from 'next/link';
import { ArrowLeft, Github, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center px-4 max-w-3xl mx-auto">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">About</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-4">ATU - Amrita Timetable Utility</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            ATU is an app that renders timetable into responsive, interactive schedule views. It provides utilities for 
            finding free classrooms, comparing schedules across sections, and viewing faculty timetables.
          It was made as a quality-of-life tool for quick scheduling and planning, whether its for personal use or collaborative projects.</p>
        </section>

        {/* Data Source */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-2">Data Source</h3>
          <p className="text-muted-foreground mb-4">
            Timetable data is fetched from the community-maintained{' '}
            <a 
              href="https://github.com/amritadottown/timetable-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-1"
            >
              timetable-registry
              <ExternalLink className="h-3 w-3" />
            </a>
            . The registry contains JSON timetable files for Amrita Bengaluru that are crowdsourced 
            by students.
          </p>
          <p className="text-muted-foreground">
            If you notice any errors in the timetable data, please contribute corrections to the registry 
            or reach out to us.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold mb-2"> Contact</h3>
          <p className="text-muted-foreground mb-4">
            Have questions, suggestions, or found a bug? Feel free to reach out!
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://www.linkedin.com/in/nithilanr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
            </a>
            <a 
              href="mailto:contact@amrita.town"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-2 border-t">
          <p className="text-sm text-muted-foreground text-center">
            Made by <a 
              href="https://www.linkedin.com/in/nithilanr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-1"
            >
                Nithilan
            </a>.
            Special thanks to the <a 
              href="https://amrita.town/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-1"
            >
                amrita.town
            </a> community for maintaining the timetable-registry.
          </p>
        </footer>
      </main>
    </div>
  );
}
