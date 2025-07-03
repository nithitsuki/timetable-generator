import React from 'react';
import coursesData from '@/data/courses.json';

export default function FacultyInfo() {

    Object.entries(coursesData).forEach(([SubjCode, SubjInfoObj]) => {
        console.log({
            SubjCode,
            SubjInfoObj,
        });
    });

    return (
        <table>
            <thead>
                <tr>
                    <th>Abbr</th>
                    <th>Subject Code</th>
                    <th>L T P CR</th>
                    <th>Subject Title</th>
                    <th>Faculty</th>
                    <th>Dept.</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(coursesData).map(([SubjCode, SubjInfoObj]) =>
                (
                    <tr key={SubjCode}>
                        <td>{SubjInfoObj["Abbreviation"]}</td>
                        <td>{SubjCode}</td>
                        <td>{SubjInfoObj["PASS/FAIL"] ? "P/F" : `${SubjInfoObj.Lectures} ${SubjInfoObj.Tutorial} ${SubjInfoObj.Practical} ${SubjInfoObj.Credits}`}</td>
                        <td>{SubjInfoObj["Subject Title"]}</td>
                        <td>
                            {Object.entries(SubjInfoObj.Faculty).map(([group, names], index) => (
                                    <React.Fragment key={`${group}-${index}`}>
                                        {index > 0 && <br />}
                                        {group === "Everyone" ? "" : `${group}: `}{Array.isArray(names) ? names.join(', ') : String(names)}
                                    </React.Fragment>
                                ))
                            }
                        </td>
                        <td>{SubjInfoObj.Department}</td>
                    </tr>
                )
                )
                }

            </tbody>
        </table>
    );
}