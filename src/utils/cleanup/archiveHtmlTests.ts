import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Archives HTML test files from root to docs/archived/html-tests/
 * Requirements: 2.1
 */

const HTML_TEST_FILES = [
  'debug-login.html',
  'superadmin-fix.html',
  'test-frontend-signin.html',
  'test-pastor-fix.html'
];

const ARCHIVE_DIR = 'docs/archived/html-tests';

interface ArchiveResult {
  file: string;
  success: boolean;
  error?: string;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}

async function archiveFile(fileName: string): Promise<ArchiveResult> {
  const sourcePath = path.join(process.cwd(), fileName);
  const destPath = path.join(process.cwd(), ARCHIVE_DIR, fileName);

  try {
    // Check if source file exists
    await fs.access(sourcePath);
    
    // Read source file
    const content = await fs.readFile(sourcePath);
    
    // Write to archive location
    await fs.writeFile(destPath, content);
    
    // Verify the archived file matches the original
    const archivedContent = await fs.readFile(destPath);
    if (!content.equals(archivedContent)) {
      throw new Error('Archived file content does not match original');
    }
    
    console.log(`✓ Archived: ${fileName} -> ${ARCHIVE_DIR}/${fileName}`);
    return { file: fileName, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to archive ${fileName}: ${errorMessage}`);
    return { file: fileName, success: false, error: errorMessage };
  }
}

async function archiveHtmlTests(): Promise<void> {
  console.log('Starting HTML test files archival...\n');
  
  // Ensure archive directory exists
  await ensureDirectoryExists(ARCHIVE_DIR);
  
  // Archive each file
  const results: ArchiveResult[] = [];
  for (const file of HTML_TEST_FILES) {
    const result = await archiveFile(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n--- Archive Summary ---');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total files: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed files:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
}

export { archiveHtmlTests };
export type { ArchiveResult };

// Auto-run when imported as main module
archiveHtmlTests().catch(console.error);
