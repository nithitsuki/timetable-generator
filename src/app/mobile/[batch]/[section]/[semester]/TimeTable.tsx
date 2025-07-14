import React from "react";
import MyCell from "@/components/MyCell";
import slotsData from "@/../public/data/slots.json";

interface TimetableProps {
    TimetableData: any;
}

export function TimeTable({ TimetableData }: TimetableProps) {
    const slotTypes = Object.keys(slotsData)

    function HHMM_ToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    function scaleWidth(numberInHHMM, inMinHHMM, inMaxHHMM, outMinPerc, outMaxPerc) {
        let number = HHMM_ToMinutes(numberInHHMM);
        let inMin = HHMM_ToMinutes(inMinHHMM); let inMax = HHMM_ToMinutes(inMaxHHMM);
        let outMin = parseInt(outMinPerc.replace("%", "").trim());
        let outMax = parseInt(outMaxPerc.replace("%", "").trim());
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }


    let DayStart = "23:59"
    let DayEnd = "00:00"
    for (const [type, slots] of Object.entries(slotsData)) {
        for (const [slotNo, StartEndTime] of Object.entries(slots)) {
            DayStart = DayStart > StartEndTime[0] ? StartEndTime[0] : DayStart
            DayEnd = DayEnd < StartEndTime[1] ? StartEndTime[1] : DayEnd
        }
    }

    return (
        <div className="grid grid-cols-6 gap-0 border border-gray-400 ">
            {/* Header row */}
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs"></div>
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs">Mon</div>
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs">Tue</div>
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs">Wed</div>
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs">Thu</div>
            <div className="border border-gray-400 bg-(--secondary) p-2 text-center font-semibold min-h-[2vh] min-h-[4.5vh] text-xs">Fri</div>

            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map((time, timeIndex) => (
                <React.Fragment key={time}>
                    {/* Time column */}
                    <div className="border border-gray-400 bg-(--secondary) p-2 text-center text-xs font-medium min-h-[9.5vh]">{time}</div>

                    {/* Day columns */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((dayHeader, dayIndex) => (
                        <div key={`$${dayIndex}`} className="border-l border-r border-gray-400 p-2 h-[9.5vh] relative">
                            {Object.entries(TimetableData).map(([courseAbbr, InfoObj]) => (
                                <React.Fragment key={`${courseAbbr}`}>
                                    {
                                        Object.entries(InfoObj["occurences"]).map(([Day, Slot]) => (
                                            <React.Fragment key={`$${Day}-${courseAbbr}`}>

                                            </React.Fragment>
                                        ))

                                    }
                                </React.Fragment>
                            ))
                            }
                        </div>
                    ))}
                </React.Fragment>
            ))}

            {
                Object.entries(TimetableData).map(([courseAbbr, InfoObj]) => (
                    <React.Fragment key={`${courseAbbr}`}>
                        {Object.entries(InfoObj["occurences"]).map(([Day, SlotInfo]) => (
                            Object.entries(SlotInfo).map(([slotType, slots]) => 
                                slots.map((slotNumber, slotIndex) => (
                                    <div key={`${Day}-${courseAbbr}-${slotType}-${slotIndex}`} className="absolute bg-(--card) text-center font-semibold h-[1vh] w-[15vw] flex items-center justify-center" 
                                        style={{ 
                                            left: `${16.5 + (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(Day)) * 16}vw`,
                                            top: `${(() => {
                                               if (slotType.toLowerCase().includes('lab')) {
                                                   // Lab slots: 1->8vh, 2->20vh, 3->40vh
                                                const labTopPositions = { 1: 0, 2: 35, 3: 58 };
                                                   return labTopPositions[slotNumber] || 8;
                                               } else {
                                                   // Theory slots: 8vh for each number starting from 1
                                                const theoryTopPositions = { 1: 0, 2: 16.5, 3: 25, 4: 36.2, 5: 44.4, 6: 64.8, 7: 73 };
                                                return theoryTopPositions[slotNumber] || 8;
                                               }
                                            })() -  3}vh`,
                                            height: `${slotType.toLowerCase().includes('lab') ? '20.8vh' : '8vh'}`
                                        }}>
                                        {slotType.toLowerCase().includes('lab') 
                                            ? `${courseAbbr} Lab` 
                                            : courseAbbr}
                                    </div>
                                ))
                            )
                        )).flat()}
                    </React.Fragment>
                ))
            }
        </div>
    );
}
