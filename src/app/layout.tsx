import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATU - Amrita Timetable Utility",
  description: "Beautiful, accessible, and powerful timetables for Amrita university students.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ATU - Amrita Timetable Utility",
    description: "Beautiful, accessible, and powerful timetables for Amrita university students.",
    url: "https://timetable.amrita.town",
    siteName: "ATU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ATU - Amrita Timetable Utility",
    description: "Beautiful, accessible, and powerful timetables for Amrita university students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="a16a921a-3bbc-4782-9f44-dad682b182c2"
          strategy="afterInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
