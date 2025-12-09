# Archived Files

This directory contains files that have been archived during the project cleanup process. All files have been safely moved here to reduce clutter in the main codebase while preserving them for future reference.

## Contents

- **manifest.json** - Comprehensive JSON manifest of all archived files with original paths, archive paths, timestamps, and summary statistics
- **MANIFEST_REPORT.md** - Human-readable report of the archive contents
- **backups/** - Backup and temporary files
- **components/** - Unused React components
- **html-tests/** - HTML test and debug files
- **markdown-docs/** - Archived documentation files
- **pages/** - Unused page components
- **scripts/** - Diagnostic and setup scripts
- **sql/** - SQL migration and setup files
  - **migrations/** - Supabase migration files
  - **supabase/** - Supabase setup files

## Archive Statistics

- **Total Files:** 87
- **Total Size:** 406.26 KB
- **Categories:** 7 (sql, markdown-docs, pages, backups, components, html-tests, scripts)

## Using the Archive

### Finding Files

1. Check `manifest.json` for the complete list of archived files with their original and archive paths
2. Review `MANIFEST_REPORT.md` for a human-readable report organized by category
3. Browse the subdirectories directly to find specific files

### Restoring Files

If you need to restore a file from the archive:

1. Locate the file in the manifest or by browsing the archive directories
2. Copy the file back to its original location (found in `manifest.json`)
3. Update any imports or references as needed

## Archive Integrity

All archived files have been verified for content integrity during the archival process. The manifest includes:

- Original file paths
- Archive file paths
- Timestamps of when files were archived
- Success status for each file
- Purpose/description for many files

## Notes

- Files were archived as part of the project cleanup specification
- The archive structure mirrors the original organization for easy navigation
- All files can be safely restored if needed
- The manifest is automatically generated and can be regenerated at any time

## Regenerating the Manifest

To regenerate the manifest after adding or removing files from the archive:

```bash
npx tsx src/utils/cleanup/runManifestGeneration.ts
```

To regenerate the human-readable report:

```bash
npx tsx src/utils/cleanup/generateManifestReport.ts
```
