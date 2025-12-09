# Database Schema Documentation

This document provides an overview of the database schema used in the Gospel Labour Ministry Church Management System.

## Tables

### 1. members

The `members` table stores information about church members, including pastors and other categories of members.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier for the member |
| fullname | text | NOT NULL | Member's full name |
| email | text | NOT NULL, CHECK (valid email format) | Member's email address |
| phone | text | CHECK (valid phone format) | Member's phone number |
| address | text | | Member's physical address |
| category | text | NOT NULL, CHECK (in valid categories) | Member category (Members, Pastors, Workers, Visitors, Partners) |
| title | text | | Pastor's title (e.g., Senior Pastor, Youth Pastor) |
| assignedto | uuid | FOREIGN KEY REFERENCES members(id) | ID of the pastor assigned to this member |
| churchunit | text | | Primary church unit the member belongs to |
| churchunits | text[] | VALIDATED | Array of church units the member belongs to |
| auxanogroup | text | | Auxano group the member belongs to |
| joindate | date | NOT NULL, DEFAULT CURRENT_DATE | Date the member joined |
| notes | text | | Additional notes about the member |
| isactive | boolean | NOT NULL, DEFAULT true | Whether the member is active |
| userid | uuid | | Reference to the auth.users table for linking members to authenticated users |
| created_at | timestamp with time zone | DEFAULT now() | Record creation timestamp |
| updated_at | timestamp with time zone | DEFAULT now(), TRIGGER | Record update timestamp |

#### Indexes

- `idx_members_fullname` - Improves performance of searches by name
- `idx_members_email` - Improves performance of searches by email
- `idx_members_category` - Improves performance when filtering by category
- `idx_members_assignedto` - Improves performance when querying members assigned to a specific pastor
- `idx_members_churchunit` - Improves performance when filtering by church unit
- `idx_members_isactive` - Improves performance when filtering active/inactive members
- `idx_members_churchunits` (GIN) - Enables efficient searching within the churchunits array

### 2. profiles

The `profiles` table stores user profile information, typically linked to authentication accounts.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY | Unique identifier for the profile (matches auth.users) |
| email | text | CHECK (valid email format) | User's email address |
| full_name | text | | User's full name |
| updated_at | timestamp with time zone | DEFAULT timezone('utc', now()) | Record update timestamp |
| church_unit | text | | User's church unit |
| assigned_pastor | text | | ID of the pastor assigned to this user |
| phone | text | CHECK (valid phone format) | User's phone number |
| genotype | text | | User's genotype |
| address | text | | User's physical address |
| role | text | SYNCED with user_roles | User's role in the system |

#### Profile Indexes

- `idx_profiles_email` - Improves performance of searches by email
- `idx_profiles_full_name` - Improves performance of searches by name
- `idx_profiles_church_unit` - Improves performance when filtering by church unit
- `idx_profiles_role` - Improves performance when filtering by role

### 3. user_roles

The `user_roles` table stores role assignments for users, supporting multiple roles per user.

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the role assignment |
| user_id | uuid | NOT NULL | ID of the user (references auth.users) |
| role | public.app_role | NOT NULL, DEFAULT 'user' | Role assigned to the user |
| created_at | timestamp with time zone | DEFAULT now() | Record creation timestamp |

#### Role Indexes

- `idx_user_roles_user_id` - Improves performance when querying roles for a specific user
- `idx_user_roles_role` - Improves performance when filtering users by role

## Views

### 1. user_roles_view

The `user_roles_view` aggregates user information with their roles for easier querying.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID |
| email | text | User email |
| full_name | text | User full name |
| highest_role | public.app_role | Highest role assigned to the user |
| all_roles | text[] | Array of all roles assigned to the user |

## Relationships

- A member can be assigned to one pastor (`members.assignedto` references `members.id` where category = 'Pastors')
- A user profile is linked to an auth user (`profiles.id` references `auth.users.id`)
- User roles are linked to auth users (`user_roles.user_id` references `auth.users.id`)
- A member can be linked to an auth user (`members.userid` references `auth.users.id`)

## Enums

### app_role

Possible values:

- 'user'
- 'admin'
- 'superuser'

## Role Synchronization

The database includes triggers to synchronize roles between the `profiles.role` field and the `user_roles` table:

1. When a role is updated in `profiles`, it is synchronized to `user_roles`
2. When roles are updated in `user_roles`, the highest role is synchronized to `profiles.role`
3. When a role is deleted from `user_roles`, the `profiles.role` is updated to the next highest role

## Data Validation

The database includes constraints and triggers to ensure data integrity:

1. Email format validation for both `members` and `profiles` tables
2. Phone number format validation for both `members` and `profiles` tables
3. Category validation for the `members` table
4. Church units validation for the `members.churchunits` array

## Migrations

Database changes are tracked using the `migrations` table, which records:

1. The name of each migration
2. When it was applied
3. A description of the changes made

To apply migrations, run:

```bash
npm run db:migrate
```

## Notes

1. The `members` table has some duplicate columns that are being phased out:
   - Use `churchunits` (lowercase) instead of `"churchUnits"` (camelCase)
   - Use `churchunit` (lowercase) instead of `"churchUnit"` (camelCase)

2. All new database columns should follow the lowercase naming convention.
