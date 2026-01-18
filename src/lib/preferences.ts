// LocalStorage keys
const STORAGE_KEYS = {
  MY_CLASS: 'timetable-my-class',
  FAVOURITES: 'timetable-favourites',
};

export interface ClassPreference {
  batch: string;
  section: string;
  semester: string;
}

export interface FavouriteClass extends ClassPreference {
  id: string; // unique identifier
  label?: string; // optional custom label
}

// Generate a unique ID for a class
export function getClassId(batch: string, section: string, semester: string): string {
  return `${batch}-${section}-${semester}`;
}

// Get the user's saved class preference
export function getMyClass(): ClassPreference | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MY_CLASS);
    if (stored) {
      return JSON.parse(stored) as ClassPreference;
    }
  } catch (e) {
    console.error('Failed to read my class from localStorage:', e);
  }
  return null;
}

// Save the user's class preference
export function setMyClass(pref: ClassPreference): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.MY_CLASS, JSON.stringify(pref));
  } catch (e) {
    console.error('Failed to save my class to localStorage:', e);
  }
}

// Clear the user's class preference
export function clearMyClass(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.MY_CLASS);
  } catch (e) {
    console.error('Failed to clear my class from localStorage:', e);
  }
}

// Get all favourite classes
export function getFavourites(): FavouriteClass[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVOURITES);
    if (stored) {
      return JSON.parse(stored) as FavouriteClass[];
    }
  } catch (e) {
    console.error('Failed to read favourites from localStorage:', e);
  }
  return [];
}

// Check if a class is in favourites
export function isFavourite(batch: string, section: string, semester: string): boolean {
  const id = getClassId(batch, section, semester);
  const favourites = getFavourites();
  return favourites.some(f => f.id === id);
}

// Add a class to favourites
export function addFavourite(batch: string, section: string, semester: string, label?: string): void {
  if (typeof window === 'undefined') return;
  
  const id = getClassId(batch, section, semester);
  const favourites = getFavourites();
  
  // Don't add if already exists
  if (favourites.some(f => f.id === id)) return;
  
  const newFav: FavouriteClass = {
    id,
    batch,
    section,
    semester,
    label,
  };
  
  try {
    localStorage.setItem(STORAGE_KEYS.FAVOURITES, JSON.stringify([...favourites, newFav]));
  } catch (e) {
    console.error('Failed to add favourite to localStorage:', e);
  }
}

// Remove a class from favourites
export function removeFavourite(batch: string, section: string, semester: string): void {
  if (typeof window === 'undefined') return;
  
  const id = getClassId(batch, section, semester);
  const favourites = getFavourites();
  const filtered = favourites.filter(f => f.id !== id);
  
  try {
    localStorage.setItem(STORAGE_KEYS.FAVOURITES, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove favourite from localStorage:', e);
  }
}

// Toggle favourite status
export function toggleFavourite(batch: string, section: string, semester: string): boolean {
  const isFav = isFavourite(batch, section, semester);
  if (isFav) {
    removeFavourite(batch, section, semester);
    return false;
  } else {
    addFavourite(batch, section, semester);
    return true;
  }
}

// Format a class for display
export function formatClassLabel(batch: string, section: string, semester: string): string {
  const gradYear = parseInt(batch) + 4;
  return `${section.toUpperCase()} - Sem ${semester} (Class of ${gradYear})`;
}

// Format a shorter label
export function formatShortLabel(section: string, semester: string): string {
  return `${section.toUpperCase()} Sem ${semester}`;
}
