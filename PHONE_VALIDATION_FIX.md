# Phone Validation Fix

## Problem
Users were getting the error: "Error updating profile: new row for relation 'profiles' violates check constraint 'valid_phone'" when trying to update their profile with Nigerian phone numbers starting with 0 (e.g., 07031098097).

## Root Cause
The database constraint `valid_phone` was using a regex pattern `^\+?[1-9]\d{1,14}$` that only allowed:
- International numbers starting with + and a digit 1-9
- Numbers starting with digits 1-9

This pattern rejected Nigerian phone numbers that start with 0.

## Solution
Updated the phone validation to support:
- ✅ Nigerian numbers: `07031098097`, `08012345678`, `09012345678`
- ✅ International numbers: `+2347031098097`, `+1234567890`
- ✅ Empty/null values (phone is optional)

## Files Changed

### 1. Database Constraint Fix
- **File**: `fix_phone_constraint.sql`
- **Purpose**: Updates the database constraint to allow Nigerian phone numbers
- **New Pattern**: `^(\+?[1-9]\d{1,14}|0[1-9]\d{8,10})$`

### 2. Frontend Validation
- **File**: `src/components/profile/ProfileEditForm.tsx`
- **Changes**: 
  - Updated Zod schema validation
  - Added phone number formatting
  - Improved error messages

### 3. Authentication Form
- **File**: `src/components/auth/AuthForm.tsx`
- **Changes**: Updated phone validation logic

### 4. Utility Functions
- **File**: `src/utils/phoneValidation.ts` (new)
- **Purpose**: Centralized phone validation logic
- **Functions**:
  - `isValidPhoneNumber()` - Validates phone format
  - `formatPhoneNumber()` - Cleans phone number
  - `getPhoneValidationMessage()` - Returns error message
  - `isNigerianPhoneNumber()` - Detects Nigerian numbers

## How to Apply the Fix

### Option 1: Automatic (Recommended)
```bash
node run_phone_fix.js
```

### Option 2: Manual Database Fix
1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_phone_constraint.sql`
4. Execute the SQL

### Option 3: Frontend Only (Temporary)
If you can't update the database immediately, the frontend validation will still prevent invalid formats from being submitted.

## Testing the Fix

After applying the fix, test with these phone numbers:

### Should Work ✅
- `07031098097` (MTN Nigeria)
- `08012345678` (Airtel Nigeria)
- `09012345678` (9mobile Nigeria)
- `+2347031098097` (International format)
- `+1234567890` (Other international)
- Empty/blank (optional field)

### Should Fail ❌
- `00123456789` (starts with 00)
- `1234` (too short)
- `abcd1234567` (contains letters)
- `+0123456789` (international starting with 0)

## Supported Nigerian Networks

The validation supports all major Nigerian mobile networks:

- **MTN**: 0703, 0706, 0803, 0806, 0810, 0813, 0814, 0816, 0903, 0906
- **Airtel**: 0701, 0708, 0802, 0808, 0812, 0901, 0902, 0904, 0907
- **Glo**: 0705, 0805, 0807, 0811, 0815, 0905
- **9mobile**: 0809, 0817, 0818, 0908, 0909

## Error Messages

Users will now see helpful error messages:
- "Please enter a valid phone number (e.g., 07031098097 or +2347031098097)"

## Future Considerations

1. **Phone Number Formatting**: Consider adding automatic formatting (e.g., adding spaces or dashes)
2. **Country Detection**: Could auto-detect country and format accordingly
3. **Verification**: Consider adding SMS verification for phone numbers
4. **Multiple Phones**: Support for multiple phone numbers per user

## Rollback Plan

If issues occur, you can rollback by:

1. **Database**: Restore the original constraint:
   ```sql
   ALTER TABLE public.profiles DROP CONSTRAINT valid_phone;
   ALTER TABLE public.profiles ADD CONSTRAINT valid_phone 
   CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$');
   ```

2. **Frontend**: Revert the changes to the form validation files

## Notes

- Phone validation is optional - users can leave the field empty
- The fix maintains backward compatibility with existing international numbers
- All phone numbers are stored without formatting (no spaces or dashes)
- The validation is consistent across signup and profile update forms