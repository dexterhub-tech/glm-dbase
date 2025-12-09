import * as fs from 'fs/promises';
import * as path from 'path';
import { FileArchiver } from './fileArchiver';
import type { UnusedFile } from './unusedFileDetector';

interface BatchFileInfo {
  filename: string;
  purpose: string;
}

/**
 * Archive batch files from the root directory
 */
export async function archiveBatchFiles(): Promise<void> {
  const batchFiles: BatchFileInfo[] = [
    {
      filename: 'fix-git-commands.bat',
      purpose: 'Git repository setup script - removes existing remote, commits changes, and provides instructions for adding GitHub remote'
    },
    {
      filename: 'fix-phone-validation.bat',
      purpose: 'Phone validation fix script - runs node script to fix phone validation constraint for Nigerian phone numbers starting with 0'
    },
    {
      filename: 'push-to-github.bat',
      purpose: 'GitHub push automation script - sets up remote, commits all changes, and pushes to gigscode/glm_database repository'
    },
    {
      filename: 'run-signup-fix.bat',
      purpose: 'Signup fix helper script - opens permanent_signup_fix.sql in notepad and provides instructions for running it in Supabase'
    }
  ];

  const archiver = new FileArchiver('docs/archived');
  
  // Ensure archive structure exists
  await archiver.createArchiveStructure();

  // Load existing manifest
  const existingManifest = await archiver.loadManifest();
  const existingFiles = existingManifest?.files || [];

  console.log('📦 Archiving batch files...\n');

  const filesToArchive: UnusedFile[] = [];
  
  // Check which files exist and prepare them for archival
  for (const batchFile of batchFiles) {
    try {
      const stats = await fs.stat(batchFile.filename);
      filesToArchive.push({
        path: batchFile.filename,
        type: 'script',
        size: stats.size,
        lastModified: stats.mtime,
        purpose: batchFile.purpose
      });
    } catch (error) {
      console.log(`⚠️  ${batchFile.filename} not found, skipping...`);
    }
  }

  if (filesToArchive.length === 0) {
    console.log('ℹ️  No batch files found to archive.');
    return;
  }

  // Archive each file
  const results = await archiver.archiveFiles(
    filesToArchive.map(file => ({ file, category: 'scripts' }))
  );

  // Display results
  console.log('\n📊 Archive Results:');
  console.log('==================\n');
  
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.originalPath} → ${result.archivePath}`);
    } else {
      console.log(`❌ ${result.originalPath} - Error: ${result.error}`);
    }
  }

  // Update manifest with batch file purposes
  const updatedFiles = [...existingFiles, ...results.map((result, index) => ({
    ...result,
    purpose: filesToArchive[index].purpose
  }))];

  const manifest = await archiver.generateManifest(updatedFiles);
  await archiver.saveManifest(manifest);

  console.log('\n✅ Manifest updated successfully!');
  console.log(`📄 Total archived files: ${manifest.summary.totalFiles}`);
  console.log(`📁 By category:`, manifest.summary.byCategory);
}

// Auto-run when executed directly
archiveBatchFiles()
  .then(() => {
    console.log('\n✨ Batch file archival complete!');
  })
  .catch((error) => {
    console.error('\n❌ Error archiving batch files:', error);
    process.exit(1);
  });
