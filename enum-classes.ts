import fs from "node:fs";
import path from "node:path";

// Define the root directory where the data is stored.
const rootDir: string = "public/data";
// Read the list of years from the root directory.
const years: string[] = fs.readdirSync(rootDir);

// Define the structure of the output data.
interface OutputData {
    version: number;
    timetables: Record<string, Record<string, string[]>>;
}

// Initialize the output data object.
const outputData: OutputData = {
    version: 1,
    timetables: {},
};

// Iterate over each year.
for (const year of years) {
    // Construct the path to the year directory.
    const yearPath: string = path.join(rootDir, year);
    // Read the list of branches from the year directory.
    const branches: string[] = fs.readdirSync(yearPath);
    // Initialize the timetables for the current year.
    outputData.timetables[year] = {};
    // Iterate over each branch.
    for (const branch of branches) {
        // Construct the path to the branch directory.
        const branchPath: string = path.join(yearPath, branch);
        // Read the list of semesters from the branch directory and remove the ".json" extension.
        const sems: string[] = fs
            .readdirSync(branchPath)
            .map((str) => path.basename(str, ".json"));
        // Assign the semesters to the corresponding year and branch in the output data.
        outputData.timetables[year][branch] = sems;
    }
}

// Write the output data to a JSON file.
fs.writeFileSync(
    "public/classes.json",
    JSON.stringify(outputData, null, 2),
    "utf-8"
);