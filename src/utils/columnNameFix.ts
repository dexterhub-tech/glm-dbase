/**
 * Utility functions to help with database column name case sensitivity issues
 */

/**
 * Safely access a property from an object, trying both camelCase and lowercase versions
 * This helps handle database column name inconsistencies
 * 
 * @param obj The object to access properties from
 * @param camelCaseProp The camelCase property name (e.g., 'fullName')
 * @param defaultValue Optional default value if neither property exists
 * @returns The value of the property or the default value
 */
export function getProperty<T, K extends keyof T>(
  obj: T, 
  camelCaseProp: K, 
  defaultValue: any = undefined
): any {
  const propStr = String(camelCaseProp);
  const lowercaseProp = propStr.toLowerCase() as K;
  
  // Try camelCase first, then lowercase, then default
  if (obj[camelCaseProp] !== undefined) {
    return obj[camelCaseProp];
  } else if (obj[lowercaseProp] !== undefined) {
    return obj[lowercaseProp];
  } else {
    return defaultValue;
  }
}

/**
 * Safely transform database records to frontend models
 * Handles column name case sensitivity by trying both camelCase and lowercase versions
 * 
 * @param record The database record to transform
 * @param mapping Object mapping frontend property names to database column names
 * @returns A new object with the transformed properties
 */
export function transformDatabaseRecord<T extends Record<string, any>>(
  record: Record<string, any>,
  mapping: Record<string, string> = {}
): T {
  const result: Record<string, any> = {};
  
  // For each property in the mapping
  Object.entries(mapping).forEach(([frontendProp, dbColumn]) => {
    // Try both the specified column name and its lowercase version
    result[frontendProp] = getProperty(record, dbColumn as any, undefined);
  });
  
  // For any properties not in the mapping, try to get them directly
  Object.keys(record).forEach(key => {
    if (!Object.values(mapping).includes(key) && !result[key]) {
      result[key] = record[key];
    }
  });
  
  return result as T;
}

/**
 * Example usage:
 * 
 * // Define mapping from frontend model to database columns
 * const memberMapping = {
 *   fullName: 'fullname',
 *   email: 'email',
 *   assignedTo: 'assignedto',
 *   churchUnit: 'churchunit',
 *   isActive: 'isactive'
 * };
 * 
 * // Transform database record to frontend model
 * const member = transformDatabaseRecord<Member>(dbRecord, memberMapping);
 */
