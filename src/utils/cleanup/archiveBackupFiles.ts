import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Archives backup and temporary files to docs/archived/backups/
 * Requirements: 2.1
 */

interface FileToArchive {
  sourcePath: string;
  fileName: string;
}

const BACKUP_FILES: FileToArchive[] = [
  { sourcePath: 'current-db-backup.json', fileName: 'current-db-backup.json' },
  { sourcePath: 'src/contexts/AuthContext-complex.tsx.bak', fileName: 'AuthContext-complex.tsx.bak' },
  { sourcePath: 'src/contexts/AuthContext.fix.js', fileName: 'AuthContext.fix.js' },
  { sourcePath: 'src/fix.js', fileName: 'fix.js' },
  { sourcePath: 'src/mobile-fix.js', fileName: 'mobile-fix.js' },
  { sourcePath: 'src/mobile-view-fix.txt', fileName: 'mobile-view-fix.txt' },
  { sourcePath: 'src/superuser-fix.js', fileName: 'superuser-fix.js' }
];

const ARCHIVE_DIR = 'docs/archived/backups';

interface ArchiveResult {
  file: string;
  success: boolean;
  error?: string;
  skipped?: boolean;
}

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}

async function archiveFile(fileInfo: FileToArchive): Promise<ArchiveResult> {
  const sourcePath = path.join(process.cwd(), fileInfo.sourcePath);
  const destPath = path.join(process.cwd(), ARCHIVE_DIR, fileInfo.fileName);

  try {
    // Check if source file exists
    try {
      await fs.access(sourcePath);
    } catch {
      console.log(`⊘ Skipped: ${fileInfo.sourcePath} (file not found)`);
      return { file: fileInfo.sourcePath, success: true, skipped: true };
    }
    
    // Read source file
    const content = await fs.readFile(sourcePath);
    
    // Write to archive location
    await fs.writeFile(destPath, content);
    
    // Verify the archived file matches the original
    const archivedContent = await fs.readFile(destPath);
    if (!content.equals(archivedContent)) {
      throw new Error('Archived file content does not match original');
    }
    
    console.log(`✓ Archived: ${fileInfo.sourcePath} -> ${ARCHIVE_DIR}/${fileInfo.fileName}`);
    return { file: fileInfo.sourcePath, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`✗ Failed to archive ${fileInfo.sourcePath}: ${errorMessage}`);
    return { file: fileInfo.sourcePath, success: false, error: errorMessage };
  }
}

async function archiveBackupFiles(): Promise<void> {
  console.log('Starting backup and temp files archival...\n');
  
  // Ensure archive directory exists
  await ensureDirectoryExists(ARCHIVE_DIR);
  
  // Archive each file
  const results: ArchiveResult[] = [];
  for (const file of BACKUP_FILES) {
    const result = await archiveFile(file);
    results.push(result);
  }
  
  // Summary
  console.log('\n--- Archive Summary ---');
  const successful = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total files: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed files:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
}

export { archiveBackupFiles };
export type { ArchiveResult };

// Auto-run when imported as main module
archiveBackupFiles().catch(console.error);
