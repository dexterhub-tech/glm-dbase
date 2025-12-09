# Component Update Guide

This guide provides instructions for updating components to use the correct database column naming conventions.

## Common Issues

The most common issue is using camelCase column names in database queries when the database uses lowercase column names.

## How to Update Components

### 1. Database Queries

Update all database queries to use lowercase column names:

```typescript
// BEFORE
const { data, error } = await supabase
  .from('members')
  .select('id, fullName, email')
  .eq('assignedTo', pastorId);

// AFTER
const { data, error } = await supabase
  .from('members')
  .select('id, fullname, email')
  .eq('assignedto', pastorId);
```

### 2. Search Filters

Update search filters to use lowercase column names:

```typescript
// BEFORE
query = query.or(`fullName.ilike.%${term}%,email.ilike.%${term}%`);

// AFTER
query = query.or(`fullname.ilike.%${term}%,email.ilike.%${term}%`);
```

### 3. Data Transformation

Use the standardization utilities when transforming data:

```typescript
// BEFORE
const formattedMembers = data.map(member => ({
  id: member.id,
  fullName: member.fullName,
  email: member.email,
  // ...other fields
}));

// AFTER
import { standardizeAllFields } from '@/utils/standardizeFields';

const formattedMembers = data.map(member => standardizeAllFields(member));
```

### 4. Database Inserts and Updates

Use the `prepareForDatabase` utility when inserting or updating records:

```typescript
// BEFORE
const { error } = await supabase
  .from('members')
  .update({
    fullName: values.fullName,
    email: values.email,
    assignedTo: values.assignedTo
  })
  .eq('id', memberId);

// AFTER
import { prepareForDatabase } from '@/utils/standardizeFields';

const { error } = await supabase
  .from('members')
  .update(prepareForDatabase({
    fullName: values.fullName,
    email: values.email,
    assignedTo: values.assignedTo
  }))
  .eq('id', memberId);
```

## Checklist of Files to Review

Review these files for potential issues:

- [ ] `src/components/admin/MembersView.tsx`
- [ ] `src/components/admin/dashboard/DashboardMembersTable.tsx`
- [ ] `src/components/admin/pastors/PastorsPage.tsx`
- [ ] `src/components/admin/pastors/PastorDetail.tsx`
- [ ] `src/components/admin/pastors/AssignMemberDialog.tsx`
- [ ] Any other components that interact with the database

## Testing

After making changes:

1. Test the affected components
2. Check for any console errors related to database queries
3. Verify that data is being displayed and saved correctly
