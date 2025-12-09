/**
 * Official Church Units for Gospel Labour Ministry
 * These are the only valid church units in the system.
 * 
 * IMPORTANT: These names are case-sensitive and must match exactly.
 * Do not modify these values without proper authorization.
 */

export interface ChurchUnit {
  id: string;
  name: string;
  description?: string;
}

/**
 * Official Church Units List
 * Last updated: 2025-01-07
 */
export const OFFICIAL_CHURCH_UNITS: ChurchUnit[] = [
  { id: "3hmedia", name: "3HMedia", description: "Media and communications ministry" },
  { id: "3hmusic", name: "3HMusic", description: "Music and worship ministry" },
  { id: "3hmovies", name: "3HMovies", description: "Film and video production ministry" },
  { id: "3hsecurity", name: "3HSecurity", description: "Security and safety ministry" },
  { id: "discipleship", name: "Discipleship", description: "Discipleship and spiritual growth ministry" },
  { id: "praisefeet", name: "Praise Feet", description: "Dance and movement ministry" },
  { id: "ushering", name: "Ushering", description: "Welcoming and Directing Worshippers" },
  { id: "sanitation", name: "Sanitation", description: "Church Sanitation and Hygiene" },

];

/**
 * Get church unit names only (for dropdowns and selects)
 */
export const CHURCH_UNIT_NAMES = OFFICIAL_CHURCH_UNITS.map(unit => unit.name);

/**
 * Get church unit IDs only (for database storage)
 */
export const CHURCH_UNIT_IDS = OFFICIAL_CHURCH_UNITS.map(unit => unit.id);

/**
 * Map church unit ID to name
 */
export const CHURCH_UNIT_ID_TO_NAME = OFFICIAL_CHURCH_UNITS.reduce((acc, unit) => {
  acc[unit.id] = unit.name;
  return acc;
}, {} as Record<string, string>);

/**
 * Map church unit name to ID
 */
export const CHURCH_UNIT_NAME_TO_ID = OFFICIAL_CHURCH_UNITS.reduce((acc, unit) => {
  acc[unit.name] = unit.id;
  return acc;
}, {} as Record<string, string>);

/**
 * Legacy church unit names that may exist in the database
 * These should be migrated to the official names
 */
export const LEGACY_CHURCH_UNITS = [
  "3H Media",
  "3H Music", 
  "3H Movies",
  "3H Security",
  "Auxano Group",
  "Administration",
  "Youth Ministry",
  "Children Ministry",
  "Ushering Ministry",
  "Welfare Ministry",
  "Security Ministry",
];

/**
 * Migration mapping from legacy names to official names
 */
export const LEGACY_TO_OFFICIAL_MAPPING: Record<string, string> = {
  "3H Media": "3HMedia",
  "3H Music": "3HMusic",
  "3H Movies": "3HMovies", 
  "3H Security": "3HSecurity",
  "Auxano Group": "Discipleship", // Assuming Auxano is part of Discipleship
  "TOF": "Cloven Tongues", // Assuming TOF maps to Cloven Tongues
  "tof": "Cloven Tongues",
  "Administration": "3HMedia", // Default mapping
  "Youth Ministry": "Discipleship",
  "Children Ministry": "Discipleship",
  "Music Ministry": "3HMusic",
  "Ushering Ministry": "3HSecurity",
  "Technical Ministry": "3HMedia",
  "Evangelism Ministry": "Discipleship",
  "Prayer Ministry": "Cloven Tongues",
  "Welfare Ministry": "Discipleship",
  "Security Ministry": "3HSecurity",
};

/**
 * Validate if a church unit name is official
 */
export const isOfficialChurchUnit = (name: string): boolean => {
  return CHURCH_UNIT_NAMES.includes(name);
};

/**
 * Get the official name for a legacy church unit
 */
export const getOfficialChurchUnitName = (legacyName: string): string => {
  return LEGACY_TO_OFFICIAL_MAPPING[legacyName] || legacyName;
};

/**
 * Validate and normalize church unit names
 */
export const normalizeChurchUnits = (units: string[]): string[] => {
  return units
    .map(unit => getOfficialChurchUnitName(unit))
    .filter(unit => isOfficialChurchUnit(unit))
    .filter((unit, index, arr) => arr.indexOf(unit) === index); // Remove duplicates
};
