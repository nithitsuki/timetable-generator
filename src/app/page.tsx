"use client";
import { redirect } from 'next/navigation';
import ClassesData from '@/../public/data/Classes.json';
import ModeToggle from '@/components/comp-130';

export default function page() {
    const Batches = ClassesData.map((batch) => batch.ClassOf);
    const handleRedirect = (classOf: string, section: string) => {
        const CurrentYear = new Date().getFullYear();
        const timeTillGrad = parseInt(classOf) - CurrentYear; // min 1, max 4
        const semester = Math.abs(timeTillGrad - 4) * 2 + 1; // Calculate semester based on graduation year logic
        const url = `/${classOf}/${section}/${semester}`;
        redirect(url);
    }
    return (
        <div className="flex flex-col items-center  min-h-screen bg-background p-6">
            <div className="text-center mb-8 relative">
                <div id='theme_toggle' className='fixed top-4 right-4 z-50'>
                    <ModeToggle />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Timetable Viewer</h1>
                <p className="text-lg text-muted-foreground">Select your class and section</p>
            </div>
            
            <div className="grid gap-6 w-full max-w-2xl">
            {ClassesData.map((batch, index) => (
            <div key={index} className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-semibold text-card-foreground mb-4 text-center border-b border-border pb-3">
                Class of {batch.ClassOf}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                {batch.Classes.map((className, idx) => (
                <button
                key={idx}
                className="bg-primary hover:cursor-pointer hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors duration-200 hover:scale-105 transform"
                onClick={() => handleRedirect(batch.ClassOf, className)}
                >
                {className}
                </button>
                ))}
            </div>
            </div>
            ))}
            </div>
        </div>
    );
}