# Cleanup Infrastructure

This directory contains utilities for the project cleanup process, implementing the cleanup specification defined in `.kiro/specs/project-cleanup/`.

## Components

### FileAnalyzer (`fileAnalyzer.ts`)

The main orchestrator that coordinates the entire analysis process.

**Key Features:**
- Builds import graph from entry points
- Detects unused files
- Categorizes files by type
- Generates comprehensive reports in multiple formats

**Usage:**
```typescript
import { FileAnalyzer } from './fileAnalyzer';

const analyzer = new FileAnalyzer('/path/to/project');
const { report, unusedFiles, categorizedFiles } = analyzer.analyzeProject(['src/main.tsx']);

// Get different report formats
const consoleReport = analyzer.getConsoleReport(report);
const markdownReport = analyzer.getMarkdownReport(report);
const jsonReport = analyzer.getJsonReport(report);
```

### AnalysisReportGenerator (`analysisReportGenerator.ts`)

Generates human-readable analysis reports in multiple formats.

**Key Features:**
- Console-friendly report with summary statistics
- Markdown report with detailed file listings
- JSON report for programmatic processing
- File size formatting (KB, MB, etc.)
- Date formatting for readability

**Report Contents:**
- Summary statistics (total files, total size)
- Category breakdown with counts and sizes
- Detailed file list with paths, sizes, and last modified dates
- Top 10 largest unused files

### ImportGraphBuilder (`importGraphBuilder.ts`)

Builds a graph of file imports starting from entry points.

**Key Features:**
- Parses static and dynamic imports
- Handles TypeScript/JavaScript files
- Resolves relative imports
- Detects circular dependencies

### UnusedFileDetector (`unusedFileDetector.ts`)

Identifies files not reachable through the import graph.

**Key Features:**
- Compares all project files against reachable files
- Excludes configuration and build files
- Determines file types based on path and extension
- Retrieves file statistics (size, last modified)

### FileCategorizer (`fileCategorizer.ts`)

Categorizes unused files by type and generates category reports.

**Key Features:**
- Groups files into categories (pages, components, scripts, SQL, etc.)
- Calculates statistics per category
- Formats file sizes and dates
- Generates category-specific reports

### FileArchiver (`fileArchiver.ts`)

The main class for archiving unused files with verification and manifest generation.

**Key Features:**
- Creates organized archive directory structure
- Archives files with content verification (byte-for-byte comparison)
- Generates comprehensive manifest of all archived files
- Tracks archive operations with success/failure status

**Usage:**
```typescript
import { FileArchiver } from './fileArchiver';

const archiver = new FileArchiver('docs/archived');
await archiver.createArchiveStructure();

const result = await archiver.archiveFile(unusedFile, 'pages');
const manifest = await archiver.generateManifest();
await archiver.saveManifest(manifest);
```

### File Operations (`fileOperations.ts`)

Utility functions for file system operations and file analysis.

**Key Features:**
- File type detection based on path and extension
- File statistics retrieval (size, last modified)
- Category mapping for different file types
- File existence checking and safe deletion
- Formatting utilities for display

**Usage:**
```typescript
import { createUnusedFile, getCategoryForFileType } from './fileOperations';

const unusedFile = await createUnusedFile('src/pages/Index.tsx');
const category = getCategoryForFileType(unusedFile.type);
```

## Archive Directory Structure

```
docs/archived/
├── pages/              # Unused page components
├── components/         # Unused UI components
├── scripts/            # Diagnostic and setup scripts
├── sql/                # SQL migration files
│   ├── migrations/     # Supabase migrations
│   └── supabase/       # Supabase directory SQL files
├── html-tests/         # HTML debugging files
├── backups/            # Backup and temporary files
├── markdown-docs/      # Duplicate/old markdown docs
└── manifest.json       # Record of all archived files
```

## Manifest Format

The manifest.json file contains:
- Version information
- Timestamp of generation
- List of all archived files with original and archive paths
- Summary statistics (total files, total size, breakdown by category)

Example:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-12-09T...",
  "files": [
    {
      "originalPath": "src/pages/Index.tsx",
      "archivePath": "docs/archived/pages/Index.tsx",
      "timestamp": "2025-12-09T...",
      "success": true
    }
  ],
  "summary": {
    "totalFiles": 1,
    "totalSize": 2048,
    "byCategory": {
      "pages": 1
    }
  }
}
```

## Running the Analysis

To run the complete analysis and generate reports:

```bash
npx tsx src/utils/cleanup/runAnalysis.ts
```

This will:
1. Build an import graph starting from `src/main.tsx` and `src/App.tsx`
2. Identify all unused files in the project
3. Categorize files by type
4. Generate three types of reports:
   - **Console Report**: Displayed in terminal with summary statistics
   - **Markdown Report**: Saved to `docs/cleanup-reports/analysis-report.md`
   - **JSON Report**: Saved to `docs/cleanup-reports/analysis-report.json`

## Testing

Run the infrastructure test to verify everything works:

```bash
npx tsx src/utils/cleanup/test-infrastructure.ts
```

## Requirements Satisfied

This infrastructure satisfies the following requirements from the specification:

- **Requirement 2.1**: Archive directory structure mirrors original organization
- **Requirement 2.2**: Preserves relative path structure within archive
- **Requirement 2.5**: Generates manifest file with original and new locations

## Next Steps

After setting up this infrastructure, the next tasks are:
1. Implement file analysis system (import graph builder)
2. Use the archiver to move unused files
3. Verify and clean up remaining code
