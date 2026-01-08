
import * as z from "zod";

export type MemberCategory = 'Members' | 'Pastors' | 'Workers' | 'Visitors' | 'Partners' | 'Sons' | 'MINT' | 'Others';
export type AppRole = 'user' | 'admin' | 'superadmin' | 'pastor';

/**
 * Enhanced Member interface representing a church member with consolidated data
 * from both members and profiles tables
 *
 * NOTE: The database uses lowercase column names (fullname, assignedto, etc.)
 * This interface uses camelCase for TypeScript conventions, but all database
 * operations should use lowercase column names in queries.
 */
export interface Member {
  // Identity
  id: string;
  _id?: string; // Mongoose ID
  user_id?: string;      // DB column: 'user_id' - references auth.users(id)

  // Basic Information (consolidated from both tables)
  email: string;
  fullname: string;      // DB column: 'fullname' - keeping lowercase for consistency
  phone?: string;
  address?: string;
  genotype?: string;     // New field from profiles table

  // Church Information
  category: MemberCategory;
  title?: string;
  assignedto?: string;   // DB column: 'assignedto' - ID of pastor assigned to this member
  churchunit?: string;   // DB column: 'churchunit' - Primary church unit
  churchunits?: string[]; // DB column: 'churchunits' - Multiple church units array
  auxanogroup?: string;  // DB column: 'auxanogroup'
  joindate: string;      // DB column: 'joindate'
  notes?: string;
  isactive: boolean;     // DB column: 'isactive'

  // Authentication and role information (from profiles)
  role: AppRole;         // DB column: 'role' - user role for permissions

  // New fields for RBAC and structure
  status: 'pending' | 'approved';
  auxanoCenter?: AuxanoCenter | string; // Populated or ID
  unit?: Unit | string; // Populated or ID
  discipleshipStatus?: boolean;

  // Metadata
  created_at: string;
  updated_at: string;

  // Legacy/compatibility fields - for backward compatibility during transition
  fullName?: string;     // Camel case variant for existing code compatibility
  assignedTo?: string;   // Camel case variant for existing code compatibility
  churchUnit?: string;   // Camel case variant for existing code compatibility
  churchUnits?: string[]; // Camel case variant for existing code compatibility
  auxanoGroup?: string;  // Camel case variant for existing code compatibility
  joinDate?: string;     // Camel case variant for existing code compatibility
  isActive?: boolean;    // Camel case variant for existing code compatibility
  assignedPastor?: Pastor; // Not a DB column - populated in code when needed
}

export const memberSchema = z.object({
  fullname: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  genotype: z.string().optional(),
  category: z.enum(["Members", "Pastors", "Workers", "Visitors", "Partners", "Sons", "MINT", "Others"]),
  title: z.string().optional(),
  assignedto: z.string().optional(),
  churchunit: z.string().optional(),
  churchunits: z.array(z.string()).optional(),
  auxanogroup: z.string().optional(),
  joindate: z.string().default(() => new Date().toISOString().split('T')[0]),
  notes: z.string().optional(),
  isactive: z.boolean().default(true),
  role: z.enum(["user", "admin", "superadmin", "pastor"]).default("user"),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

/**
 * Profile interface for user profile data
 * This represents the profiles table with extended user information
 */
export interface Profile {
  id: string;           // auth.users.id - direct reference to auth table
  email: string;
  full_name?: string;   // DB column: 'full_name' - basic name for auth purposes
  phone?: string;       // DB column: 'phone' - user's phone number
  genotype?: string;    // DB column: 'genotype' - user's genotype
  address?: string;     // DB column: 'address' - user's address
  church_unit?: string; // DB column: 'church_unit' - user's church unit
  assigned_pastor?: string; // DB column: 'assigned_pastor' - assigned pastor ID
  date_of_birth?: string;   // DB column: 'date_of_birth' - user's date of birth
  created_at: string;
  updated_at: string;
}

export const profileSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  genotype: z.string().optional(),
  address: z.string().optional(),
  church_unit: z.string().optional(),
  assigned_pastor: z.string().optional(),
  date_of_birth: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Pastor interface representing a church pastor
 * This is now a specialized view of the Member interface for pastors
 *
 * NOTE: The database uses lowercase column names (fullname, churchunit, etc.)
 * This interface uses the same structure as Member but with pastor-specific fields
 */
export interface Pastor {
  id: string;
  fullname: string;      // DB column: 'fullname'
  email: string;
  phone?: string;
  title?: string;
  address?: string;
  genotype?: string;
  category: 'Pastors';   // Always 'Pastors' for pastor records
  assignedto?: string;   // DB column: 'assignedto' - Pastor can be assigned to another pastor
  churchunit?: string;   // DB column: 'churchunit' - Primary church unit
  churchunits?: string[]; // DB column: 'churchunits' - Multiple church units
  auxanogroup?: string;  // DB column: 'auxanogroup'
  joindate: string;      // DB column: 'joindate'
  notes?: string;
  isactive: boolean;     // DB column: 'isactive'
  role: AppRole;         // DB column: 'role'
  user_id?: string;      // DB column: 'user_id'
  created_at: string;
  updated_at: string;
  memberCount?: number;  // Not a DB column - calculated in code

  // Legacy compatibility fields
  fullName?: string;     // Camel case variant for existing code compatibility
  assignedTo?: string;   // Camel case variant for existing code compatibility
  churchUnit?: string;   // Camel case variant for existing code compatibility
  auxanoGroup?: string;  // Camel case variant for existing code compatibility
}

/**
 * Worker interface representing a church worker
 * This is now a specialized view of the Member interface for workers
 */
export interface Worker {
  id: string;
  fullname: string;      // DB column: 'fullname'
  email: string;
  phone?: string;
  title?: string;
  address?: string;
  genotype?: string;
  category: 'Workers';   // Always 'Workers' for worker records
  assignedto?: string;   // DB column: 'assignedto' - Pastor assigned to this worker
  churchunit?: string;   // DB column: 'churchunit' - Primary church unit
  churchunits?: string[]; // DB column: 'churchunits' - Multiple church units
  auxanogroup?: string;  // DB column: 'auxanogroup'
  joindate: string;      // DB column: 'joindate'
  notes?: string;
  isactive: boolean;     // DB column: 'isactive'
  role: AppRole;         // DB column: 'role'
  user_id?: string;      // DB column: 'user_id'
  created_at: string;
  updated_at: string;

  assignedTo?: string;   // Camel case variant for existing code compatibility
  churchUnit?: string;   // Camel case variant for existing code compatibility
  auxanoGroup?: string;  // Camel case variant for existing code compatibility
}

export interface AuxanoCenter {
  id: string;
  name: string;
  location: string;
  pastors: string[]; // User IDs
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  description?: string;
  head?: string; // User/Member ID
  created_at: string;
  updated_at: string;
}

export interface User {
  _id: string;
  email: string;
  role: AppRole;
  assignedAuxanoCenter?: string;
  profile?: {
    full_name?: string;
    phone?: string;
    [key: string]: any;
  };
  token?: string;
}
