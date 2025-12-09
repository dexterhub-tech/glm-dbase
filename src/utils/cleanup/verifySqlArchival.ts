import * as fs from 'fs/promises';
import * as path from 'path';
import { FileArchiver } from './fileArchiver';

/**
 * Verify that SQL files were archived correctly
 */
export async function verifySqlArchival(): Promise<void> {
  console.log('🔍 Verifying SQL file archival...\n');

  const archiver = new FileArchiver('docs/archived');
  const manifest = await archiver.loadManifest();

  if (!manifest) {
    console.log('❌ No manifest found. Run archiveSqlFiles first.');
    return;
  }

  // Filter SQL files from manifest (handle both forward and backslashes)
  const sqlFiles = manifest.files.filter(file => 
    (file.archivePath.includes('/sql/') || file.archivePath.includes('\\sql\\')) && file.success
  );

  if (sqlFiles.length === 0) {
    console.log('ℹ️  No SQL files found in manifest.');
    return;
  }

  console.log(`📊 Found ${sqlFiles.length} SQL files in manifest\n`);

  let verifiedCount = 0;
  let failedCount = 0;

  // Verify each archived SQL file
  for (const file of sqlFiles) {
    try {
      // Check if archived file exists
      await fs.access(file.archivePath);
      
      // Check if original file still exists (it should until deletion phase)
      let originalExists = false;
      try {
        await fs.access(file.originalPath);
        originalExists = true;
      } catch {
        // Original file may have been deleted, which is okay
      }

      // If original exists, verify content matches
      if (originalExists) {
        const originalContent = await fs.readFile(file.originalPath);
        const archivedContent = await fs.readFile(file.archivePath);
        
        if (Buffer.compare(originalContent, archivedContent) === 0) {
          console.log(`✅ ${path.basename(file.originalPath)} - Content verified`);
          verifiedCount++;
        } else {
          console.log(`❌ ${path.basename(file.originalPath)} - Content mismatch!`);
          failedCount++;
        }
      } else {
        // Just verify archived file exists
        console.log(`✅ ${path.basename(file.originalPath)} - Archived (original removed)`);
        verifiedCount++;
      }
    } catch (error) {
      console.log(`❌ ${path.basename(file.originalPath)} - Verification failed: ${error}`);
      failedCount++;
    }
  }

  console.log('\n📊 Verification Summary:');
  console.log('========================');
  console.log(`✅ Verified: ${verifiedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📁 Total: ${sqlFiles.length}`);

  // Categorize by subdirectory
  const byCategory: Record<string, number> = {};
  for (const file of sqlFiles) {
    const category = file.archivePath.split('/').slice(-2, -1)[0] || 'sql';
    byCategory[category] = (byCategory[category] || 0) + 1;
  }

  console.log('\n📂 By Category:');
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count} files`);
  }

  if (failedCount > 0) {
    console.log('\n⚠️  Some files failed verification. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✨ All SQL files verified successfully!');
  }
}

// Export for use in other scripts
export default verifySqlArchival;

// Auto-run when executed directly
verifySqlArchival().catch((error) => {
  console.error('\n❌ Error verifying SQL archival:', error);
  process.exit(1);
});
