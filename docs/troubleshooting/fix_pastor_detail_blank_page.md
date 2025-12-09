# Fixing Blank Page in Pastor Detail View

This document explains how to fix the issue where the pastor detail page goes blank when clicking "View Members" under a pastor.

## The Problem

When clicking "View Members" under a pastor, the page goes blank. This is likely due to inconsistencies in the database column naming (camelCase vs. lowercase) and the component not properly handling these inconsistencies.

## The Solution

We've updated the PastorDetail component to handle case inconsistencies in the database by:

1. Adding normalization functions for both pastor and member data
2. Adding more robust error handling and logging
3. Ensuring that properties are accessed in a case-insensitive way

## Changes Made

### 1. Added Normalization Functions

We've added two normalization functions to handle case inconsistencies:

```typescript
// Normalize member data to handle case inconsistencies
const normalizeMembers = (members: any[]): Member[] => {
  return members.map(member => ({
    id: member.id,
    fullName: member.fullName || member.fullname || '',
    email: member.email || '',
    phone: member.phone || '',
    address: member.address || '',
    category: member.category || '',
    joinDate: member.joinDate || member.joindate || new Date().toISOString(),
    notes: member.notes || '',
    isActive: member.isActive || member.isactive || false
  }));
};

// Normalize pastor data to handle case inconsistencies
const normalizePastor = (pastor: any): Pastor | null => {
  if (!pastor) return null;
  return {
    id: pastor.id,
    fullName: pastor.fullName || pastor.fullname || '',
    email: pastor.email || '',
    phone: pastor.phone || '',
    title: pastor.title || '',
    bio: pastor.bio || '',
    churchUnit: pastor.churchUnit || pastor.churchunit || '',
    auxanoGroup: pastor.auxanoGroup || pastor.auxanogroup || ''
  };
};
```

### 2. Updated Data Fetching

We've updated the `fetchPastorAndMembers` function to use our normalization functions:

```typescript
const fetchPastorAndMembers = async () => {
  if (!pastorId) return;

  try {
    setLoading(true);
    console.log('Fetching pastor details for ID:', pastorId);

    // Fetch pastor details
    const { data: pastorData, error: pastorError } = await supabase
      .from('members')
      .select('*')
      .eq('id', pastorId)
      .eq('category', 'Pastors')
      .single();

    if (pastorError) {
      console.error('Error fetching pastor:', pastorError);
      throw pastorError;
    }

    console.log('Pastor data received:', pastorData);
    
    // Normalize pastor data
    const normalizedPastor = normalizePastor(pastorData);
    setPastor(normalizedPastor);

    // Fetch members assigned to this pastor
    console.log('Fetching members assigned to pastor:', pastorId);
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('assignedto', pastorId);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    console.log(`Found ${membersData?.length || 0} members assigned to this pastor`);
    
    // Set members (will be normalized in the filteredMembers computation)
    setMembers(membersData || []);
  } catch (error: any) {
    console.error('Error fetching pastor details:', error);
    toast({
      variant: "destructive",
      title: "Error fetching pastor details",
      description: error.message
    });
    // Set empty arrays to avoid undefined errors
    setPastor(null);
    setMembers([]);
  } finally {
    setLoading(false);
  }
};
```

### 3. Updated Filtering Logic

We've updated the filtering logic to use our normalized data:

```typescript
// Filter members based on search query
const filteredMembers = normalizeMembers(members).filter(member => {
  const name = member.fullName.toLowerCase();
  const email = member.email.toLowerCase();
  const category = member.category.toLowerCase();
  const query = searchQuery.toLowerCase();

  return name.includes(query) || email.includes(query) || category.includes(query);
});
```

## Why This Fixes the Issue

The main issue was that the component was trying to access properties that might have different casing in the database (e.g., `fullName` vs. `fullname`, `isActive` vs. `isactive`). By adding normalization functions, we ensure that the component can handle these inconsistencies.

Additionally, we've added more robust error handling and logging to help diagnose any future issues.

## Testing the Fix

To test that the fix works:

1. Go to the pastors page
2. Click "View" under a pastor
3. Verify that the pastor detail page loads correctly
4. Verify that the assigned members are displayed correctly

If you encounter any issues, check the browser console for error messages and ensure that all the components are properly updated.
