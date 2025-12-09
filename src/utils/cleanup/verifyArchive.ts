import * as fs from 'fs/promises';
import * as path from 'path';

interface ArchiveEntry {
  originalPath: string;
  archivePath: string;
  timestamp: string;
  success: boolean;
  purpose?: string;
}

interface Manifest {
  version: string;
  timestamp: string;
  files: ArchiveEntry[];
  summary: {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, number>;
  };
}

interface VerificationResult {
  passed: boolean;
  totalFiles: number;
  verified: number;
  missing: string[];
  contentMismatches: string[];
  errors: string[];
}

export async function verifyArchive(manifestPath: string = 'docs/archived/manifest.json'): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    totalFiles: 0,
    verified: 0,
    missing: [],
    contentMismatches: [],
    errors: []
  };

  try {
    // Read manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);
    
    result.totalFiles = manifest.files.length;
    
    console.log(`\n📋 Verifying ${result.totalFiles} archived files...\n`);
    
    // Verify each archived file
    for (const entry of manifest.files) {
      try {
        // Check if archived file exists
        const archiveExists = await fileExists(entry.archivePath);
        
        if (!archiveExists) {
          result.missing.push(entry.archivePath);
          result.errors.push(`❌ Missing: ${entry.archivePath} (original: ${entry.originalPath})`);
          result.passed = false;
          continue;
        }
        
        // Check if original file still exists (it should until deletion phase)
        const originalExists = await fileExists(entry.originalPath);
        
        if (originalExists) {
          // Verify content matches
          const originalContent = await fs.readFile(entry.originalPath, 'utf-8');
          const archivedContent = await fs.readFile(entry.archivePath, 'utf-8');
          
          if (originalContent !== archivedContent) {
            result.contentMismatches.push(entry.originalPath);
            result.errors.push(`⚠️  Content mismatch: ${entry.originalPath}`);
            result.passed = false;
            continue;
          }
        }
        
        result.verified++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`❌ Error verifying ${entry.originalPath}: ${errorMsg}`);
        result.passed = false;
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total files in manifest: ${result.totalFiles}`);
    console.log(`Successfully verified: ${result.verified}`);
    console.log(`Missing files: ${result.missing.length}`);
    console.log(`Content mismatches: ${result.contentMismatches.length}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log('='.repeat(60));
    
    if (result.passed) {
      console.log('\n✅ All archived files verified successfully!\n');
    } else {
      console.log('\n❌ Verification failed. See errors above.\n');
      
      if (result.errors.length > 0) {
        console.log('\nDetailed Errors:');
        result.errors.forEach(err => console.log(err));
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Fatal error reading manifest: ${errorMsg}`);
    result.passed = false;
  }
  
  return result;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Only run if this is the main module (not imported)
if (process.argv[1]?.includes('verifyArchive.ts')) {
  verifyArchive()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
