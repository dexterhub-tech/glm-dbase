/**
 * Utility functions to standardize fields across the application
 *
 * These utilities handle the conversion between database column names (lowercase)
 * and TypeScript interface properties (camelCase).
 *
 * Database convention: fullname, assignedto, churchunit, isactive
 * TypeScript convention: fullName, assignedTo, churchUnit, isActive
 */

/**
 * Standardizes church unit fields from a database record
 * Handles both singular (churchUnit/churchunit) and plural (churchUnits/churchunits) fields
 *
 * @param record - The database record to standardize
 * @returns The standardized record with consistent church unit fields
 */
export const standardizeChurchUnitFields = <T extends Record<string, any>>(record: T): T => {
  const result = { ...record };

  // Extract all possible church unit fields
  const churchUnit = (record as any).churchUnit;
  const churchunit = (record as any).churchunit;
  const churchUnits = (record as any).churchUnits;
  const churchunits = (record as any).churchunits;

  // Standardize the plural fields (arrays)
  if (Array.isArray(churchUnits) && churchUnits.length > 0) {
    (result as any).churchUnits = churchUnits;
    (result as any).churchunits = churchUnits;
  } else if (Array.isArray(churchunits) && churchunits.length > 0) {
    (result as any).churchUnits = churchunits;
    (result as any).churchunits = churchunits;
  } else if (churchUnit) {
    // If no arrays but we have a singular value, create arrays
    (result as any).churchUnits = [churchUnit];
    (result as any).churchunits = [churchUnit];
  } else if (churchunit) {
    // If no arrays but we have a singular value, create arrays
    (result as any).churchUnits = [churchunit];
    (result as any).churchunits = [churchunit];
  } else {
    // Ensure we have empty arrays rather than null/undefined
    (result as any).churchUnits = [];
    (result as any).churchunits = [];
  }

  // Standardize the singular fields
  if (churchUnit) {
    (result as any).churchUnit = churchUnit;
    (result as any).churchunit = churchUnit;
  } else if (churchunit) {
    (result as any).churchUnit = churchunit;
    (result as any).churchunit = churchunit;
  } else if (Array.isArray((result as any).churchUnits) && (result as any).churchUnits.length > 0) {
    // If we have arrays but no singular value, use the first array element
    (result as any).churchUnit = (result as any).churchUnits[0];
    (result as any).churchunit = (result as any).churchUnits[0];
  } else {
    // Ensure we have empty strings rather than null/undefined
    (result as any).churchUnit = '';
    (result as any).churchunit = '';
  }

  return result;
};

/**
 * Standardizes auxano group field from a database record
 *
 * @param record - The database record to standardize
 * @returns The standardized record with consistent auxano group field
 */
export const standardizeAuxanoGroupField = <T extends Record<string, any>>(record: T): T => {
  const result = { ...record };

  // Ensure auxanoGroup is always defined
  if ((record as any).auxanoGroup === null || (record as any).auxanoGroup === undefined) {
    (result as any).auxanoGroup = '';
  }

  return result;
};

/**
 * Standardizes name fields from a database record
 * Handles both camelCase and lowercase variants (fullName/fullname)
 *
 * @param record - The database record to standardize
 * @returns The standardized record with consistent name fields
 */
export const standardizeNameFields = <T extends Record<string, any>>(record: T): T => {
  const result = { ...record };

  // Extract possible name fields
  const fullName = (record as any).fullName;
  const fullname = (record as any).fullname;

  // Standardize the name fields
  if (fullName) {
    (result as any).fullName = fullName;
    (result as any).fullname = fullName;
  } else if (fullname) {
    (result as any).fullName = fullname;
    (result as any).fullname = fullname;
  }

  return result;
};

/**
 * Standardizes assigned to field from a database record
 * Handles both camelCase and lowercase variants (assignedTo/assignedto)
 *
 * @param record - The database record to standardize
 * @returns The standardized record with consistent assigned to field
 */
export const standardizeAssignedToField = <T extends Record<string, any>>(record: T): T => {
  const result = { ...record };

  // Extract possible fields
  const assignedTo = (record as any).assignedTo;
  const assignedto = (record as any).assignedto;

  // Standardize the fields
  if (assignedTo) {
    (result as any).assignedTo = assignedTo;
    (result as any).assignedto = assignedTo;
  } else if (assignedto) {
    (result as any).assignedTo = assignedto;
    (result as any).assignedto = assignedto;
  }

  return result;
};

/**
 * Standardizes is active field from a database record
 * Handles both camelCase and lowercase variants (isActive/isactive)
 *
 * @param record - The database record to standardize
 * @returns The standardized record with consistent is active field
 */
export const standardizeIsActiveField = <T extends Record<string, any>>(record: T): T => {
  const result = { ...record };

  // Extract possible fields
  const isActive = (record as any).isActive;
  const isactive = (record as any).isactive;

  // Standardize the fields
  if (isActive !== undefined) {
    (result as any).isActive = isActive;
    (result as any).isactive = isActive;
  } else if (isactive !== undefined) {
    (result as any).isActive = isactive;
    (result as any).isactive = isactive;
  } else {
    // Default to true if not specified
    (result as any).isActive = true;
    (result as any).isactive = true;
  }

  return result;
};

/**
 * Prepares a record for database insertion or update
 * Converts from TypeScript camelCase to database lowercase
 *
 * @param record - The TypeScript record to prepare for database
 * @returns The record with database-compatible field names
 */
export const prepareForDatabase = <T extends Record<string, any>>(record: T): Record<string, any> => {
  const result: Record<string, any> = {};

  // Map camelCase fields to lowercase for database
  Object.keys(record).forEach(key => {
    // Skip undefined values
    if (record[key] === undefined) return;

    // Convert camelCase to lowercase
    const dbKey = key.toLowerCase();
    result[dbKey] = record[key];
  });

  return result;
};

/**
 * Standardizes all fields from a database record
 *
 * @param record - The database record to standardize
 * @returns The standardized record with all fields standardized
 */
export const standardizeAllFields = <T extends Record<string, any>>(record: T): T => {
  let result = standardizeChurchUnitFields(record);
  result = standardizeAuxanoGroupField(result);
  result = standardizeNameFields(result);
  result = standardizeAssignedToField(result);
  result = standardizeIsActiveField(result);
  return result;
};

/**
 * Standardizes all fields from an array of database records
 *
 * @param records - The array of database records to standardize
 * @returns The array of standardized records
 */
export const standardizeAllRecords = <T extends Record<string, any>>(records: T[]): T[] => {
  return records.map(standardizeAllFields);
};
