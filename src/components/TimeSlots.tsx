import React from "react";
import MyCell from "@/components/MyCell";
import slotsData from "@/data/slots.json";

export function TimeSlots() {
    const slotTypes = Object.keys(slotsData)

    function HHMM_ToMinutes(timeStr) {
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
        <>
            {
                slotTypes.map((type, id) => (
                    <div id={`SLOTS-${id}`} key={String(id)} className='flex flex-row max-h-(--time-slot-height)  border-solid '
                        // style={{ backgroundColor: (type === "lab" ? "hsl(60, 15%, 65%)" : "hsl(118, 15%, 65%)"), }}
                        style={{ padding: '0px', borderLeft: '1px solid var(--foreground)', borderBottom: '1px solid var(--foreground)' }}
                    >

                        <MyCell className="min-w-(--slot-name) max-w-(--slot-name) max-h-(--time-slot-height) "
                            style={{ backgroundColor: (type === "lab" ? "var(--slot-yellow)" : "var(--slot-green)"), }}
                        >{type}</MyCell>
                        <div className='relative '>
                            {Object.entries(slotsData[type]).map(([slotNo, StartEndTime]) => (
                                <MyCell
                                    key={slotNo}
                                    className='text-sm p-0 max-h-(--time-slot-height)'
                                    style={{
                                        position: 'absolute',
                                        left: `${scaleWidth(StartEndTime[0], DayStart, DayEnd, "0%", "100%") / 100 * 640 * 0.868}px`,
                                        width: `${scaleWidth(StartEndTime[1], DayStart, DayEnd, "0%", "100%") / 100 * 640 * 0.87 - scaleWidth(StartEndTime[0], DayStart, DayEnd, "0%", "100%") / 100 * 640 * 0.87}px`,
                                        padding: '0rem',
                                        backgroundColor: (type === "lab" ? "var(--slot-yellow)" : "var(--slot-green)"),
                                        fontSize: '1rem',
                                        outline: '1px solid var(--foreground)',
                                        outlineOffset: '0px',
                                    }}
                                >
                                    {StartEndTime[0]}{type === 'lab' ? (<pre className='py-[11px]'> - </pre>) : (<br></br>)}{StartEndTime[1]}
                                    {/* {console.log("start time: ", StartEndTime[0], "left-position: ",scaleWidth(StartEndTime[0], DayStart, DayEnd,slotName, mainSpace))} */}
                                </MyCell>
                            ))}
                        </div>
                    </div>
                ))
            }
        </>
    );
}
