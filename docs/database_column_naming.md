# Database Column Naming Conventions

This document provides guidelines for handling database column names in the application to avoid common errors.

## Common Issues

1. **Case Sensitivity**: PostgreSQL column names are case-sensitive when quoted, but case-insensitive when not quoted. In our application, we use lowercase column names in the database.

2. **Aggregate Functions**: Supabase has limitations on using aggregate functions in certain contexts. Always use client-side aggregation when possible.

## Column Naming Conventions

| Database Column (lowercase) | TypeScript Property (camelCase) |
|----------------------------|--------------------------------|
| `fullname`                 | `fullName`                     |
| `email`                    | `email`                        |
| `assignedto`               | `assignedTo`                   |
| `churchunit`               | `churchUnit`                   |
| `churchunits`              | `churchUnits`                  |
| `isactive`                 | `isActive`                     |
| `joindate`                 | `joinDate`                     |
| `auxanogroup`              | `auxanoGroup`                  |

## Best Practices

### 1. Always use lowercase column names in database queries

```typescript
// CORRECT
const { data, error } = await supabase
  .from('members')
  .select('id, fullname, email')
  .eq('assignedto', pastorId);

// INCORRECT
const { data, error } = await supabase
  .from('members')
  .select('id, fullName, email')
  .eq('assignedTo', pastorId);
```

### 2. Use the standardization utilities when mapping database records to TypeScript objects

```typescript
import { standardizeAllFields } from '@/utils/standardizeFields';
import { transformDatabaseRecord } from '@/utils/columnNameFix';

// Option 1: Use standardizeAllFields
const formattedMembers = data.map(member => standardizeAllFields(member));

// Option 2: Use transformDatabaseRecord with explicit mapping
const memberMapping = {
  fullName: 'fullname',
  email: 'email',
  assignedTo: 'assignedto',
  churchUnit: 'churchunit',
  isActive: 'isactive'
};
const formattedMembers = data.map(member => 
  transformDatabaseRecord<Member>(member, memberMapping)
);
```

### 3. When accessing properties, handle both cases

```typescript
// CORRECT
const name = member.fullname || member.fullName || "";

// BETTER - Use the utility function
import { getProperty } from '@/utils/columnNameFix';
const name = getProperty(member, 'fullName', "");
```

### 4. Avoid aggregate functions in Supabase queries

```typescript
// INCORRECT - Using aggregate functions in Supabase
const { data, error } = await supabase
  .from('members')
  .select('COUNT(*)')
  .eq('category', 'Pastors');

// CORRECT - Get the raw data and count client-side
const { data, error } = await supabase
  .from('members')
  .select('id')
  .eq('category', 'Pastors');

const count = data?.length || 0;
```

## Fixing Common Errors

### "column members.fullName does not exist"

This error occurs when you try to access a camelCase column name in a database query. Fix it by:

1. Using lowercase column names in all database queries
2. Using the standardization utilities to map between database and TypeScript

### "Use of aggregate functions is not allowed"

This error occurs when trying to use SQL aggregate functions in Supabase queries. Fix it by:

1. Fetching the raw data and performing aggregation client-side
2. Using separate queries for each metric instead of complex aggregations

## Database Schema Maintenance

To ensure column name consistency, periodically run the standardization SQL script:

```sql
-- Run this in the Supabase SQL editor
SELECT public.sync_column_names();
```

This will synchronize column names across the database and ensure consistency.
