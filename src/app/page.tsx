"use client";
import { ClassesDataType } from '@/Types';
import ClassesDataRaw from '@/../public/classes.json';
import ModeToggle from '@/components/comp-130';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { time } from 'console';

export default function page() {
    const ClassesData: ClassesDataType = ClassesDataRaw as ClassesDataType;
    const years = Object.keys(ClassesData.timetables);
    const [batch, setBatch] = useState(years[0]);
    const sections = Object.keys(ClassesData.timetables[batch]);
    const [section, setSection] = useState(sections[0]);
    const semesters = Object.values(ClassesData.timetables[batch][section]);
    const [semester, setSemester] = useState(semesters[0]);

    const handleBatchChange = (value: string) => {
        setBatch(value);
        setSection(Object.keys(ClassesData.timetables[value])[0]);
        setSemester(Object.values(ClassesData.timetables[value][Object.keys(ClassesData.timetables[value])[0]])[0]);
    };

    const handleSectionChange = (value: string) => {
        setSection(value);
        setSemester(Object.values(ClassesData.timetables[batch][value])[0]);
    };

    const handleSemesterChange = (value: string) => {
        setSemester(value);
    };
    const router = useRouter();

    function handleGoButton() {
        const timetable = ClassesData.timetables[batch][section][semester];
        if (timetable) {
            router.push(`/${batch}/${section}/${semester}`);
        } else {
            alert("Timetable not found for the selected options.");
            console.error(`Timetable not found for batch: ${batch}, section: ${section}, semester: ${semester}`);
            console.error("timetable data:", timetable);
        }
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

            <div className="w-full max-w-xs sm:max-w-none sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:space-x-4">
                <Select value={batch} onValueChange={handleBatchChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((b, id) => (
                            <SelectItem key={id} value={b}>{parseInt(b) + 4}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={section} onValueChange={handleSectionChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                        {sections.map((s, id) => (
                            <SelectItem key={id} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={semester} onValueChange={handleSemesterChange}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                        {semesters.map((s, id) => (
                            <SelectItem key={id} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button className="w-full sm:w-auto" onClick={() => {handleGoButton();}}>Go!</Button>
            </div>
        </div>
    );
}