// Legacy types - kept for backward compatibility
// New types are in src/lib/types.ts

export interface ClassesDataType {
    version: number;
    timetables: {
        [year: string]: {
            [group: string]: string[];
        };
    };
}

// Re-export new types for convenience
export * from './lib/types';