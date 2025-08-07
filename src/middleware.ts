// import { redirect } from 'next/navigation';
// import { NextRequest, NextResponse } from 'next/server';

// // This function checks if a user agent string belongs to a mobile device.
// function isMobile(userAgent: string | null): boolean {
//     if (!userAgent) return false;
//     // A simple regex that checks for common mobile keywords in the user agent string.
//     // This is a common, though not exhaustive, way to check for mobile devices.
//     return /Mobi|Android|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
// }

// export function handleRedirect(classOf: string, section: string) {
//     const CurrentYear = new Date().getFullYear();
//     const timeTillGrad = parseInt(classOf) - CurrentYear; // min 1, max 4
//     const semester = Math.abs(timeTillGrad - 4) * 2 + 1; // Calculate semester based on graduation year logic
//     const url = `/${classOf}/${section}/${semester}`;
//     redirect(url);
// }

// export function middleware(request: NextRequest): NextResponse {
//     const userAgent = request.headers.get('user-agent');
//     const isMobileDevice = isMobile(userAgent);
//     const url = request.nextUrl.clone();

//     // Condition 1: Check if the user is on a mobile device.
//     // Condition 2: Check if the user is at the root path ('/').
//     // Condition 3: Check that the user is not ALREADY in the mobile subdirectory.
//     if (isMobileDevice && url.pathname === '/') {
//         // If all conditions are met, redirect to the mobile version.
//         url.pathname = '/mobile';
//         return NextResponse.redirect(url);
//     }

//     // If not a mobile device or already on the correct page, continue to the next middleware or page.
//     return NextResponse.next();
// }

export function middleware(){}