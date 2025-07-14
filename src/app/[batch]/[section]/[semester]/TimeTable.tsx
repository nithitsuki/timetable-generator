import React, { Fragment } from 'react';
// import TimetableData from '@/data/timetable.json';
import slotsData from '../../../../../public/data/slots.json';
import MyCell from '@/components/MyCell';
// Convert time strings to minutes since midnight, then subtract
function HHMM_ToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}
function scaleWidth(numberInHHMM: string, inMinHHMM: string, inMaxHHMM: string, outMinPerc: string, outMaxPerc: string) {
    let number = HHMM_ToMinutes(numberInHHMM);
    let inMin = HHMM_ToMinutes(inMinHHMM); let inMax = HHMM_ToMinutes(inMaxHHMM);
    let outMin = parseInt(outMinPerc.replace("%", "").trim());
    let outMax = parseInt(outMaxPerc.replace("%", "").trim());
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

interface TimetableProps {
    TimetableData: any;
}

export default function TimeTable({TimetableData}: TimetableProps) {

    let DayStart = "23:59"
    let DayEnd = "00:00"
    for (const [type, slots] of Object.entries(slotsData)) {
        for (const [slotNo, StartEndTime] of Object.entries(slots)) {
            DayStart = DayStart > StartEndTime[0] ? StartEndTime[0] : DayStart
            DayEnd = DayEnd < StartEndTime[1] ? StartEndTime[1] : DayEnd
        }
    }

    return (
        <>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, id) => (
                <div key={day} id={day} className=' min-h-(--time-slot-height) flex flex-row  border-solid' style={{ padding: '0px', borderLeft: '1px solid var(--foreground)',borderBottom: '1px solid var(--foreground)' }}>
                    <MyCell className="min-w-(--slot-name) max-w-(--slot-name)  bg-(--sidebar-accent)" >{day.slice(0, 3)}</MyCell>
                    {/* style={{ backgroundColor: `hsl(${30 * id }, 40%, 56%)` }}  for colored days */}
                    <div className='relative '>
                        {Object.entries(TimetableData).map(([courseAbbr, InfoObj]) => (
                            <div key={`${day}-${courseAbbr}`} id={`${day}-${courseAbbr}`}>
                                {InfoObj["occurences"] && typeof InfoObj["occurences"] === 'object' && Object.entries(InfoObj["occurences"]).map(([Day, DayInfo]) => (
                                    <Fragment key={`${day}-${Day}-${courseAbbr}`}>
                                        {day === Day && (
                                            <Fragment key={`${day}-${Day}-${courseAbbr}-inner`}>
                                                {Object.entries(DayInfo).map(([slotType, slotNums]) =>
                                                    slotNums.map((slot) => {
                                                        const StartEndTime = (slotsData as any)[slotType][slot];
                                                        const startPos = scaleWidth(StartEndTime[0], DayStart, DayEnd, "0%", "100%") / 100 * 640 * 0.87;
                                                        const endPos = scaleWidth(StartEndTime[1], DayStart, DayEnd, "0%", "100%") / 100 * 640 * 0.868;
                                                        return (
                                                            <MyCell
                                                                key={`${courseAbbr}-${slotType}-${slot}`}
                                                                className='text-sm p-0 h-(--subject-cell-height)'
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: `${startPos}px`,
                                                                    // bottom: '2px',
                                                                    width: `${endPos - startPos}px`,
                                                                    padding: '0rem',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: (slotType === "lab" ? "var(--timetable-yellow)" : "var(--timetable-green)"),
                                                                    outline: '1px solid var(--foreground)',
                                                                    outlineOffset: '0px',


                                                                }}
                                                            >
                                                                {courseAbbr} {slotType === "lab" ? slotType.toUpperCase() : ""} <br></br>
                                                            </MyCell>
                                                        );
                                                    })
                                                )}
                                            </Fragment>
                                        )}
                                    </Fragment>
                                ))}

                            </div>
                        ))}
                    </div>
                </div>
            ))
            }
        </>
    );
}