export interface ClassesDataType {
    version: number;
    timetables: {
        [year: string]: {
            [group: string]: string[];
        };
    };
}