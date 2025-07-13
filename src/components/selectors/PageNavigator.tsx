"use client";
import { useRouter } from "next/navigation";
import ModeToggle from '@/components/comp-130';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ClassesData from "@/../public/data/Classes.json";

export default function PageNavigator({ batch, section, semester, batches, sections }) {
    const router = useRouter();

    const handleBatchChange = (newBatch: string) => {
        const defaultSection = ClassesData.find(ExistingBatchObj => {return(ExistingBatchObj.ClassOf === newBatch);})?.Classes[0] || sections[0];
        const CurrentYear = new Date().getFullYear();
        const timeTillGrad = parseInt(newBatch) - CurrentYear; //min 1, max 4
        const CurrentSemester = Math.abs(timeTillGrad - 4)*2 + 1; //first time for me solving problems lmao
        router.push(`/${newBatch}/${defaultSection}/${CurrentSemester}`);
    };

    const handleSectionChange = (newSection: string) => {
        router.push(`/${batch}/${newSection}/${semester}`);
    };

    return (
        <>
            <Select defaultValue={batch} onValueChange={handleBatchChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent>
                    {batches.map((b, id) => (
                        <SelectItem key={id} value={b}>{b}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div id='theme_toggle' className='flex flex-row items-center justify-center mr-2'>
                <h3>Flashbang:&nbsp;&nbsp;</h3>
                <ModeToggle />
            </div>

            <Select defaultValue={section} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                    {sections.map((s, id) => (
                        <SelectItem key={id} value={s}>{s}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}