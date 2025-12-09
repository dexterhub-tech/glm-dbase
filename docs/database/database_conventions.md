# Database Naming Conventions

This document outlines the naming conventions for our database schema and how they map to our TypeScript code.

## Database Column Naming

- **Use lowercase snake_case** for all database column names
  - Example: `fullname`, `church_unit`, `assigned_pastor`
- **Avoid camelCase or PascalCase** in the database
- **Avoid quoted identifiers** unless absolutely necessary

## TypeScript Interface Naming

- **Use camelCase** for all TypeScript interface properties
  - Example: `fullName`, `churchUnit`, `assignedPastor`
- **Document database column names** in comments next to interface properties
- **Use standardization utilities** to convert between database and code conventions

## Example Mapping

| Database Column | TypeScript Property | Notes |
|----------------|---------------------|-------|
| `fullname`     | `fullName`          | |
| `email`        | `email`             | (Same in both) |
| `assignedto`   | `assignedTo`        | |
| `churchunit`   | `churchUnit`        | |
| `churchunits`  | `churchUnits`       | Array type |
| `isactive`     | `isActive`          | Boolean type |

## Query Guidelines

When writing database queries, always use the database column names (lowercase):

```typescript
// CORRECT
const { data } = await supabase
  .from('members')
  .select('id, fullname, email')
  .eq('assignedto', pastorId);

// INCORRECT
const { data } = await supabase
  .from('members')
  .select('id, fullName, email')
  .eq('assignedTo', pastorId);
```

## Standardization Utilities

Always use the standardization utilities when converting between database records and TypeScript objects:

```typescript
import { standardizeAllFields } from '@/utils/standardizeFields';

// When receiving data from the database
const formattedMembers = data.map(member => standardizeAllFields(member));

// When sending data to the database
const dbRecord = {
  fullname: member.fullName,
  email: member.email,
  assignedto: member.assignedTo
};
```
