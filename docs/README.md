# Gospel Labour Ministry CMS - Documentation Index

Welcome to the documentation for the Gospel Labour Ministry Church Management System. This index provides a comprehensive overview of all documentation resources, both active and archived.

## 📚 Table of Contents

- [Active Documentation](#active-documentation)
  - [Database](#database)
  - [Authentication](#authentication)
  - [Features](#features)
  - [Troubleshooting](#troubleshooting)
  - [Cleanup Reports](#cleanup-reports)
- [Archived Documentation](#archived-documentation)
- [Quick Links](#quick-links)

---

## Active Documentation

### Database

Documentation related to database schema, conventions, and naming standards.

- **[Database Schema](database/database_schema.md)** - Complete database schema documentation including tables, relationships, and constraints
- **[Database Conventions](database/database_conventions.md)** - Naming conventions and best practices for database development
- **[Database Column Naming](database/database_column_naming.md)** - Standardized column naming guidelines

### Authentication

Documentation for authentication, authorization, and role management systems.

- **[Authentication Verification System](authentication/authentication_verification_system.md)** - System for verifying user authentication and permissions
- **[Role Management](authentication/role_management.md)** - User roles, permissions, and access control documentation

### Features

Guides for implementing and updating application features.

- **[Component Update Guide](features/component_update_guide.md)** - Best practices for updating React components
- **[Environment Variables](features/environment_variables.md)** - Configuration and environment variable documentation

### Troubleshooting

Solutions to common issues and bugs encountered during development.

- **[Fix Add Pastor UserID Issue](troubleshooting/fix_add_pastor_userid_issue.md)** - Solution for pastor creation UserID constraint issues
- **[Fix Blank Page After Admin Actions](troubleshooting/fix_blank_page_after_admin_actions.md)** - Resolving blank page issues in admin interface
- **[Fix Foreign Key Constraint Issue](troubleshooting/fix_foreign_key_constraint_issue.md)** - Database foreign key constraint troubleshooting
- **[Fix Pastor Detail Blank Page](troubleshooting/fix_pastor_detail_blank_page.md)** - Resolving pastor detail page rendering issues
- **[Fix Sync New Users Button](troubleshooting/fix_sync_new_users_button.md)** - User synchronization button fixes
- **[Fix User Roles RLS Issue](troubleshooting/fix_user_roles_rls_issue.md)** - Row Level Security (RLS) policy fixes

### Cleanup Reports

Reports generated during the project cleanup process.

- **[Analysis Report (JSON)](cleanup-reports/analysis-report.json)** - Machine-readable cleanup analysis data
- **[Analysis Report (Markdown)](cleanup-reports/analysis-report.md)** - Human-readable cleanup analysis and findings

---

## Archived Documentation

Historical documentation, implementation guides, and files that have been archived during the project cleanup process. All archived files are preserved for reference and potential future use.

### Archive Categories

#### 📄 Pages & Components
Unused page components and UI components from the public-facing website.

- **[Archive Summary](archived/ARCHIVE_SUMMARY.md)** - Complete summary of archived pages and components
- **Location:** `docs/archived/pages/` and `docs/archived/components/`
- **Files:** 13 files (8 pages, 5 components)

#### 📝 Markdown Documentation
Implementation guides, fix documentation, and diagnostic reports.

- **[Markdown Docs Archive Summary](archived/MARKDOWN_DOCS_ARCHIVE_SUMMARY.md)** - Summary of archived markdown files
- **Location:** `docs/archived/markdown-docs/`
- **Categories:** Implementation guides, fix guides, diagnostic reports

#### 🗄️ SQL Files
Database migration files, schema updates, and SQL fixes.

- **[SQL Files Archive Summary](archived/SQL_FILES_ARCHIVE_SUMMARY.md)** - Complete SQL archival documentation
- **Locations:** 
  - `docs/archived/sql/` - Root SQL files
  - `docs/archived/sql/migrations/` - Supabase integration migrations
  - `docs/archived/sql/supabase/` - Supabase directory SQL files
- **Files:** 35+ SQL migration and fix files

#### 🔧 Scripts & Batch Files
Diagnostic scripts, setup scripts, and batch automation files.

- **[Batch Files Archive Summary](archived/BATCH_FILES_ARCHIVE_SUMMARY.md)** - Batch file archival documentation
- **Location:** `docs/archived/scripts/`
- **Files:** JavaScript diagnostic scripts and Windows batch files

#### 🧪 HTML Test Files
HTML debugging and testing files used during development.

- **Location:** `docs/archived/html-tests/`
- **Files:** Debug login pages, test signin pages, and other HTML test utilities

#### 💾 Backup Files
Database backups and temporary backup files.

- **Location:** `docs/archived/backups/`
- **Files:** JSON database backups, .bak files, and temporary fix scripts

### Archive Manifest

A complete, machine-readable manifest of all archived files is available:

- **[Archive Manifest (JSON)](archived/manifest.json)** - Complete inventory with original paths, archive paths, timestamps, and statistics

---

## Quick Links

### For Developers

- **Getting Started:** Review [Database Schema](database/database_schema.md) and [Authentication System](authentication/authentication_verification_system.md)
- **Making Changes:** Check [Component Update Guide](features/component_update_guide.md) and [Database Conventions](database/database_conventions.md)
- **Troubleshooting:** Browse the [Troubleshooting](troubleshooting/) directory for common issues

### For Database Administrators

- **Schema Reference:** [Database Schema](database/database_schema.md)
- **Naming Standards:** [Database Column Naming](database/database_column_naming.md)
- **Historical Migrations:** [SQL Files Archive](archived/SQL_FILES_ARCHIVE_SUMMARY.md)

### For Project Maintainers

- **Cleanup Reports:** [Analysis Report](cleanup-reports/analysis-report.md)
- **Archive Overview:** All archive summaries in [archived/](archived/) directory
- **Historical Reference:** Complete archive manifest at [archived/manifest.json](archived/manifest.json)

---

## Documentation Standards

### Active Documentation

Active documentation should be:
- **Current:** Reflects the current state of the application
- **Accurate:** Verified to match actual implementation
- **Organized:** Placed in the appropriate category directory
- **Linked:** Referenced in this index

### Archived Documentation

Archived documentation is:
- **Preserved:** Kept for historical reference
- **Organized:** Categorized by type in the archive structure
- **Documented:** Summarized in archive summary files
- **Accessible:** Available through this index and the manifest

---

## Contributing to Documentation

When adding new documentation:

1. **Choose the right category:** Place files in the appropriate directory (database, authentication, features, troubleshooting)
2. **Update this index:** Add links to new documentation in the relevant section
3. **Follow naming conventions:** Use lowercase with underscores (e.g., `my_feature_guide.md`)
4. **Include metadata:** Add creation date and author information at the top of documents
5. **Cross-reference:** Link to related documentation where appropriate

---

## Archive Information

**Last Updated:** December 9, 2025  
**Total Archived Files:** 50+ files across all categories  
**Archive Structure Version:** 1.0  

For questions about archived files or to request restoration of archived content, refer to the specific archive summary documents or the complete manifest.

---

## Project Context

This is the documentation for the **Gospel Labour Ministry Church Management System**, a React-based admin dashboard application built with:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend:** Supabase (PostgreSQL database, authentication, storage)
- **Primary Features:** Member management, pastor management, event management, user administration, church units organization

The application is primarily an admin dashboard system focused on church administration and member management.
