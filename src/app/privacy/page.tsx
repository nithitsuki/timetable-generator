"use client";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
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
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-6">Privacy Policy</h2>
        
        <p className="text-muted-foreground mb-8">
          Last updated: January 2026
        </p>

        {/* Introduction */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Introduction</h3>
          <p className="text-muted-foreground leading-relaxed">
            ATU (Amrita Timetable Utility) is committed to protecting your privacy. This policy 
            explains what information we collect, how we use it, and your rights regarding your data.
          </p>
        </section>

        {/* Data Collection */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">What We Collect</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            <strong className="text-foreground">We do not collect any personal information.</strong> ATU 
            is designed with privacy in mind:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
            <li>No user accounts or login required</li>
            <li>No personal data is sent to our servers</li>
            <li>No tracking or analytics cookies</li>
            <li>No third-party advertising</li>
          </ul>
        </section>

        {/* Local Storage */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Local Storage</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            ATU stores your preferences locally on your device using browser localStorage. This includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
            <li><strong className="text-foreground">Your Class:</strong> Your selected batch, section, and semester for quick access</li>
            <li><strong className="text-foreground">Favourites:</strong> Timetables you&apos;ve marked as favourites</li>
            <li><strong className="text-foreground">Theme Preference:</strong> Your dark/light mode setting</li>
          </ul>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            This data never leaves your device and is not transmitted to any server. You can clear this 
            data at any time by clearing your browser&apos;s local storage or site data.
          </p>
        </section>

        {/* External Data */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Timetable & Schedule Data</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            ATU fetches timetable data from the{' '}
            <a 
              href="https://github.com/amritadottown/timetable-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              timetable-registry
            </a>
            , a community-maintained repository. This data includes:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2 mb-4">
            <li><strong className="text-foreground">Class Timetables:</strong> Course schedules for various batches and sections</li>
            <li><strong className="text-foreground">Teacher Names:</strong> Faculty names associated with courses, used for the Teacher Schedule feature</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            This information is sourced from publicly available university timetables and is maintained 
            by the community. ATU does not collect, store, or process this data on its own servers—it 
            is fetched directly from the registry at runtime. The fetch requests do not include any 
            identifying information about you.
          </p>
        </section>

        {/* Third Party */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Hosting & Third-Party Services</h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            ATU is hosted on{' '}
            <a 
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Vercel
            </a>
            . As part of their infrastructure, Vercel may collect:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2 mb-4">
            <li>IP addresses</li>
            <li>Browser type and version</li>
            <li>Operating system information</li>
            <li>Referring URLs</li>
            <li>Access timestamps</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            This is standard web server logging and is handled by Vercel, not by ATU. For more details, 
            please refer to{' '}
            <a 
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Vercel&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* Closed Source */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Source Code</h3>
          <p className="text-muted-foreground leading-relaxed">
            ATU is a closed-source application. While the timetable data comes from an open community 
            registry, the application code itself is proprietary. This does not affect your privacy—the 
            application still operates entirely client-side with no data collection.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Your Rights</h3>
          <p className="text-muted-foreground leading-relaxed">
            Since we don&apos;t collect personal data, there&apos;s nothing to delete or export. Your locally 
            stored preferences can be managed through your browser settings. You have full control 
            over your data.
          </p>
        </section>

        {/* Changes */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Changes to This Policy</h3>
          <p className="text-muted-foreground leading-relaxed">
            We may update this privacy policy from time to time. Any changes will be reflected on 
            this page with an updated &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Contact</h3>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this privacy policy, please contact {' '}
            <a 
              href="mailto:hi@nithitsuki.com"
              className="text-blue-500 hover:underline"
            >
              hi@nithitsuki.com
            </a>
            .
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t">
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
