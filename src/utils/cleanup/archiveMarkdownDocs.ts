import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Archives scattered markdown documentation files to docs/archived/markdown-docs/
 * This includes implementation guides, fix guides, and setup instructions
 */

interface ArchiveResult {
  originalPath: string;
  archivePath: string;
  success: boolean;
  error?: string;
}

const MARKDOWN_FILES_TO_ARCHIVE = [
  'CHURCH_UNITS_IMPLEMENTATION.md',
  'db-error.md',
  'diagnostic-report.md',
  'EVENT_DETAIL_FIX.md',
  'EVENT_IMAGE_ENHANCEMENT.md',
  'EVENT_MANAGEMENT_SETUP.md',
  'PHONE_VALIDATION_FIX.md',
  'SETUP_SUPERUSER_ACCESS.md',
  'SIGNUP_ERROR_PERMANENT_FIX.md',
  'SIGNUP_FIX_GUIDE.md',
  'SOLUTION.md',
  'SYNC_SETUP_INSTRUCTIONS.md',
];

const ARCHIVE_DIR = 'docs/archived/markdown-docs';

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

async function archiveFile(fileName: string): Promise<ArchiveResult> {
  const originalPath = fileName;
  const archivePath = path.join(ARCHIVE_DIR, fileName);

  try {
    // Check if source file exists
    await fs.access(originalPath);

    // Read the file content
    const content = await fs.readFile(originalPath, 'utf-8');

    // Write to archive location
    await fs.writeFile(archivePath, content, 'utf-8');

    // Verify the archived file matches the original
    const archivedContent = await fs.readFile(archivePath, 'utf-8');
    if (content !== archivedContent) {
      throw new Error('Archived file content does not match original');
    }

    console.log(`✓ Archived: ${originalPath} → ${archivePath}`);

    return {
      originalPath,
      archivePath,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to archive ${originalPath}: ${errorMessage}`);

    return {
      originalPath,
      archivePath,
      success: false,
      error: errorMessage,
    };
  }
}

export async function archiveMarkdownDocs(): Promise<ArchiveResult[]> {
  console.log('Starting markdown documentation archival...\n');

  // Ensure archive directory exists
  await ensureDirectoryExists(ARCHIVE_DIR);

  // Archive each file
  const results: ArchiveResult[] = [];
  for (const fileName of MARKDOWN_FILES_TO_ARCHIVE) {
    const result = await archiveFile(fileName);
    results.push(result);
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n=== Markdown Archival Summary ===`);
  console.log(`Total files: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed files:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.originalPath}: ${r.error}`));
  }

  return results;
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  archiveMarkdownDocs()
    .then(() => {
      console.log('\nMarkdown archival complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nMarkdown archival failed:', error);
      process.exit(1);
    });
}
