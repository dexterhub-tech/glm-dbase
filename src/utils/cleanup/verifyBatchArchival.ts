import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Verify that batch files were archived correctly
 */
async function verifyBatchArchival(): Promise<void> {
  const batchFiles = [
    'fix-git-commands.bat',
    'fix-phone-validation.bat',
    'push-to-github.bat',
    'run-signup-fix.bat'
  ];

  console.log('🔍 Verifying batch file archival...\n');

  let allVerified = true;

  for (const filename of batchFiles) {
    const originalPath = filename;
    const archivePath = path.join('docs', 'archived', 'scripts', filename);

    try {
      // Check if original exists
      const originalExists = await fs.access(originalPath).then(() => true).catch(() => false);
      
      // Check if archive exists
      const archiveExists = await fs.access(archivePath).then(() => true).catch(() => false);

      if (!archiveExists) {
        console.log(`❌ ${filename}: Archive not found at ${archivePath}`);
        allVerified = false;
        continue;
      }

      // Compare content
      const originalContent = await fs.readFile(originalPath);
      const archivedContent = await fs.readFile(archivePath);

      if (Buffer.compare(originalContent, archivedContent) === 0) {
        console.log(`✅ ${filename}: Content verified (original ${originalExists ? 'exists' : 'removed'})`);
      } else {
        console.log(`❌ ${filename}: Content mismatch!`);
        allVerified = false;
      }
    } catch (error) {
      console.log(`❌ ${filename}: Error during verification - ${error}`);
      allVerified = false;
    }
  }

  // Check manifest
  console.log('\n📄 Checking manifest...');
  try {
    const manifestPath = path.join('docs', 'archived', 'manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    const batchFileEntries = manifest.files.filter((f: any) => 
      f.originalPath.endsWith('.bat')
    );

    console.log(`   Found ${batchFileEntries.length} batch file entries in manifest`);
    
    for (const entry of batchFileEntries) {
      if (entry.purpose) {
        console.log(`   ✅ ${path.basename(entry.originalPath)}: Purpose documented`);
      } else {
        console.log(`   ⚠️  ${path.basename(entry.originalPath)}: Purpose missing`);
      }
    }

    if (batchFileEntries.length === batchFiles.length) {
      console.log('\n✅ All batch files are documented in manifest');
    } else {
      console.log(`\n⚠️  Expected ${batchFiles.length} entries, found ${batchFileEntries.length}`);
      allVerified = false;
    }
  } catch (error) {
    console.log(`\n❌ Error reading manifest: ${error}`);
    allVerified = false;
  }

  if (allVerified) {
    console.log('\n✨ Batch file archival verification PASSED!');
  } else {
    console.log('\n⚠️  Batch file archival verification FAILED - see errors above');
    process.exit(1);
  }
}

// Run verification
verifyBatchArchival()
  .catch((error) => {
    console.error('❌ Verification error:', error);
    process.exit(1);
  });
