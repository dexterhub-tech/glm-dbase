# Design Document

## Overview

This design outlines a systematic approach to cleaning up the church management application codebase. The application is primarily an admin dashboard system built with React, TypeScript, Vite, and Supabase. Analysis reveals that the project contains numerous unused files including:

- Public-facing pages (Index, About, Events, Sermons, Contact, Partnership, Terms) that are not routed
- Diagnostic and migration scripts in the root directory
- SQL migration files scattered throughout the project
- HTML test files for debugging
- Duplicate documentation files
- Backup and temporary files

The cleanup will be performed in phases to ensure safety and maintain application functionality throughout the process.

## Architecture

### Current Application Structure

The application follows a standard React SPA architecture:
- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Primary Route**: Admin Dashboard (`/admin/*`)
- **Authentication**: Supabase-based auth with custom context
- **State Management**: React Query for server state
- **UI Framework**: Shadcn/ui components with Tailwind CSS

### Cleanup Architecture

The cleanup process will use a **three-phase approach**:

1. **Analysis Phase**: Identify unused files through static analysis
2. **Archive Phase**: Move unused files to organized archive structure
3. **Verification Phase**: Ensure application still functions correctly

### Archive Directory Structure

```
docs/
├── archived/
│   ├── pages/              # Unused page components
│   ├── scripts/            # Diagnostic and setup scripts
│   ├── sql/                # SQL migration files
│   ├── html-tests/         # HTML debugging files
│   ├── markdown-docs/      # Duplicate/old markdown docs
│   └── manifest.json       # Record of all archived files
├── database/               # Active database documentation
├── authentication/         # Active auth documentation
├── features/               # Active feature documentation
└── README.md               # Documentation index
```

## Components and Interfaces

### File Analyzer

**Purpose**: Identify unused files through import graph analysis

**Interface**:
```typescript
interface FileAnalyzer {
  analyzeImports(entryPoints: string[]): ImportGraph;
  findUnusedFiles(importGraph: ImportGraph): UnusedFile[];
  categorizeFiles(files: UnusedFile[]): CategorizedFiles;
}

interface ImportGraph {
  nodes: Map<string, FileNode>;
  edges: Map<string, string[]>;
}

interface UnusedFile {
  path: string;
  type: FileType;
  size: number;
  lastModified: Date;
}

type FileType = 
  | 'component' 
  | 'page' 
  | 'script' 
  | 'sql' 
  | 'html' 
  | 'markdown' 
  | 'config';

interface CategorizedFiles {
  pages: UnusedFile[];
  scripts: UnusedFile[];
  sql: UnusedFile[];
  html: UnusedFile[];
  markdown: UnusedFile[];
  other: UnusedFile[];
}
```

### File Archiver

**Purpose**: Move files to archive directory while preserving structure

**Interface**:
```typescript
interface FileArchiver {
  createArchiveStructure(): void;
  archiveFile(file: UnusedFile, category: string): ArchiveResult;
  generateManifest(archivedFiles: ArchiveResult[]): Manifest;
}

interface ArchiveResult {
  originalPath: string;
  archivePath: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface Manifest {
  version: string;
  timestamp: Date;
  files: ArchiveResult[];
  summary: {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, number>;
  };
}
```

### Code Cleaner

**Purpose**: Remove unused imports and dead code from active files

**Interface**:
```typescript
interface CodeCleaner {
  findUnusedImports(filePath: string): string[];
  findUnusedExports(filePath: string): string[];
  removeDeadCode(filePath: string): CleanupResult;
}

interface CleanupResult {
  filePath: string;
  removedImports: string[];
  removedExports: string[];
  linesRemoved: number;
  success: boolean;
}
```

### Verification System

**Purpose**: Ensure application functionality after cleanup

**Interface**:
```typescript
interface VerificationSystem {
  runTypeCheck(): VerificationResult;
  checkImports(): VerificationResult;
  validateRoutes(): VerificationResult;
  generateReport(): VerificationReport;
}

interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface VerificationReport {
  timestamp: Date;
  typeCheck: VerificationResult;
  imports: VerificationResult;
  routes: VerificationResult;
  overallStatus: 'passed' | 'failed' | 'warnings';
}
```

## Data Models

### Unused Files Identified

Based on route analysis, the following files are unused:

**Pages (Not Routed)**:
- `src/pages/Index.tsx` - Public homepage
- `src/pages/About.tsx` - About page
- `src/pages/Events.tsx` - Events listing
- `src/pages/Sermons.tsx` - Sermons library
- `src/pages/Contact.tsx` - Contact form
- `src/pages/Partnership.tsx` - Giving/partnership page
- `src/pages/Terms.tsx` - Terms and conditions
- `src/pages/EventDetail.tsx` - Event detail page

**Components (Potentially Unused)**:
- `src/components/Header.tsx` - Public site header
- `src/components/Hero.tsx` - Hero section component
- `src/components/EventCard.tsx` - Event card component
- `src/components/SermonCard.tsx` - Sermon card component
- `src/components/Footer.tsx` - Public site footer

**Scripts (Root Directory)**:
- `add_multiple_superadmins.js`
- `add_requested_superadmins.js`
- `check_users.js`
- `diagnose.js`
- `diagnose_database.js`
- `direct_superadmin_add.js`
- `run_phone_fix.js`
- `verify_superadmins.js`

**HTML Test Files**:
- `debug-login.html`
- `superadmin-fix.html`
- `test-frontend-signin.html`
- `test-pastor-fix.html`

**SQL Files (Root & Scattered)**:
- `DIRECT_SQL_FIX.sql`
- `emergency_fix_simple.sql`
- `fix_phone_constraint.sql`
- `fix_superuser_access.sql`
- `fix_user_operations.sql`
- `simple_phone_fix.sql`
- All SQL files in `src/integrations/supabase/` (migrations)
- All SQL files in `supabase/` directory

**Markdown Documentation (Scattered)**:
- `CHURCH_UNITS_IMPLEMENTATION.md`
- `db-error.md`
- `diagnostic-report.md`
- `EVENT_DETAIL_FIX.md`
- `EVENT_IMAGE_ENHANCEMENT.md`
- `EVENT_MANAGEMENT_SETUP.md`
- `PHONE_VALIDATION_FIX.md`
- `SETUP_SUPERUSER_ACCESS.md`
- `SIGNUP_ERROR_PERMANENT_FIX.md`
- `SIGNUP_FIX_GUIDE.md`
- `SOLUTION.md`
- `SYNC_SETUP_INSTRUCTIONS.md`

**Batch Files**:
- `fix-git-commands.bat`
- `fix-phone-validation.bat`
- `push-to-github.bat`
- `run-signup-fix.bat`

**Backup/Temp Files**:
- `current-db-backup.json`
- `src/contexts/AuthContext-complex.tsx.bak`
- `src/contexts/AuthContext.fix.js`
- `src/fix.js`
- `src/mobile-fix.js`
- `src/mobile-view-fix.txt`
- `src/superuser-fix.js`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File archival preserves content

*For any* file being archived, the content in the archive location should be byte-for-byte identical to the original file content before archival.

**Validates: Requirements 2.1, 2.2**

### Property 2: Import resolution after cleanup

*For any* TypeScript/JavaScript file remaining in the active codebase after cleanup, all import statements should resolve to existing files without errors.

**Validates: Requirements 3.5, 5.3**

### Property 3: Route accessibility preservation

*For any* route defined in App.tsx before cleanup, that route should still be accessible and render without errors after cleanup.

**Validates: Requirements 5.2**

### Property 4: Archive manifest completeness

*For any* file moved to the archive, there should exist exactly one corresponding entry in the archive manifest with matching original and archive paths.

**Validates: Requirements 2.5**

### Property 5: No broken imports in active code

*For any* import statement in active code after cleanup, the imported module should exist and export the referenced symbols.

**Validates: Requirements 3.5, 5.3**

### Property 6: Documentation consolidation uniqueness

*For any* topic in the consolidated documentation, there should exist exactly one authoritative document covering that topic.

**Validates: Requirements 4.4**

### Property 7: TypeScript compilation success

*For any* state of the codebase after cleanup operations, running TypeScript compilation should complete without errors.

**Validates: Requirements 5.1**

## Error Handling

### File Operation Errors

- **File Not Found**: Log warning and continue with other files
- **Permission Denied**: Report error and skip file, add to manual review list
- **Disk Space**: Check available space before operations, fail gracefully if insufficient
- **File Lock**: Retry up to 3 times with exponential backoff

### Import Analysis Errors

- **Parse Error**: Log file path and error, mark for manual review
- **Circular Dependencies**: Detect and report, but don't block cleanup
- **Dynamic Imports**: Conservative approach - don't mark as unused if dynamically imported

### Verification Errors

- **TypeScript Errors**: Report all errors with file locations and line numbers
- **Missing Imports**: List all broken imports with suggestions for fixes
- **Route Errors**: Identify which routes are broken and why

### Rollback Strategy

If verification fails:
1. Keep archive intact
2. Provide detailed error report
3. Offer selective rollback of specific files
4. Do not proceed with additional cleanup until issues resolved

## Testing Strategy

### Unit Testing

We will write unit tests for:

- File path manipulation functions
- Import graph construction
- File categorization logic
- Manifest generation
- Archive path calculation

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property-based tests. Each test will run a minimum of 100 iterations.

Property-based tests will verify:

1. **File Content Preservation** (Property 1)
   - Generate random file contents
   - Archive the file
   - Verify archived content matches original

2. **Import Resolution** (Property 2, 5)
   - Generate random valid import graphs
   - Remove random unused files
   - Verify all remaining imports resolve

3. **Manifest Completeness** (Property 4)
   - Generate random sets of files to archive
   - Create manifest
   - Verify every archived file has exactly one manifest entry

4. **Route Preservation** (Property 3)
   - Generate random route configurations
   - Perform cleanup
   - Verify all original routes still work

### Integration Testing

Integration tests will:

- Run full cleanup on a test copy of the codebase
- Verify TypeScript compilation succeeds
- Check that all admin routes still render
- Validate authentication flow still works
- Ensure database connections remain functional

### Manual Testing Checklist

After automated tests pass:

1. Start development server
2. Navigate to `/admin` route
3. Test login functionality
4. Verify admin dashboard loads
5. Check member management features
6. Test pastor management
7. Verify events management
8. Check user management
9. Test church units navigation
10. Verify profile page loads

## Implementation Notes

### Phase 1: Analysis

1. Build import graph starting from `src/main.tsx` and `src/App.tsx`
2. Identify all reachable files
3. Mark unreachable files as unused
4. Categorize unused files by type
5. Generate analysis report for user review

### Phase 2: Archival

1. Create archive directory structure
2. For each unused file:
   - Calculate archive path
   - Copy file to archive
   - Verify copy succeeded
   - Add to manifest
3. Generate final manifest
4. Present summary to user for approval

### Phase 3: Removal

Only after user approval:
1. Delete original files
2. Update any documentation references
3. Run verification suite
4. Generate cleanup report

### Phase 4: Code Cleanup

1. Scan active files for unused imports
2. Remove unused imports
3. Identify unused exports
4. Remove dead code
5. Run verification after each file

### Phase 5: Documentation Organization

1. Consolidate duplicate docs
2. Create logical directory structure
3. Generate documentation index
4. Update any cross-references

## Dependencies

- **TypeScript Compiler API**: For import analysis and type checking
- **fast-check**: For property-based testing
- **Node.js fs/promises**: For file operations
- **glob**: For file pattern matching
- **Vite**: For build verification

## Rollout Plan

1. Create feature branch for cleanup work
2. Run analysis phase, review with user
3. Perform archival on approved files
4. Run verification suite
5. If verification passes, proceed with removal
6. Perform code cleanup
7. Run full test suite
8. Manual testing by user
9. Merge to main branch only after user approval
