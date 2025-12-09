import * as fs from 'fs/promises';
import * as path from 'path';

interface ArchiveResult {
  originalPath: string;
  archivePath: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

async function archiveSupabaseSqlFiles(): Promise<void> {
  const sourceDir = 'src/integrations/supabase';
  const targetDir = 'docs/archived/sql/migrations';
  const results: ArchiveResult[] = [];

  try {
    // Read all files in the source directory
    const files = await fs.readdir(sourceDir);
    
    // Filter for SQL files only
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    console.log(`Found ${sqlFiles.length} SQL files in ${sourceDir}`);
    
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    // Process each SQL file
    for (const file of sqlFiles) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        // Check if file already exists in archive
        try {
          await fs.access(targetPath);
          console.log(`✓ Already archived: ${file}`);
          results.push({
            originalPath: sourcePath,
            archivePath: targetPath,
            timestamp: new Date(),
            success: true,
            skipped: true,
            reason: 'Already exists in archive'
          });
          continue;
        } catch {
          // File doesn't exist in archive, proceed with copy
        }
        
        // Read source file
        const content = await fs.readFile(sourcePath, 'utf-8');
        
        // Write to archive
        await fs.writeFile(targetPath, content, 'utf-8');
        
        // Verify the copy
        const archivedContent = await fs.readFile(targetPath, 'utf-8');
        
        if (content === archivedContent) {
          console.log(`✓ Archived: ${file}`);
          results.push({
            originalPath: sourcePath,
            archivePath: targetPath,
            timestamp: new Date(),
            success: true
          });
        } else {
          throw new Error('Content verification failed');
        }
      } catch (error) {
        console.error(`✗ Failed to archive ${file}:`, error);
        results.push({
          originalPath: sourcePath,
          archivePath: targetPath,
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Generate summary
    const successful = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n=== Archive Summary ===');
    console.log(`Total SQL files: ${sqlFiles.length}`);
    console.log(`Newly archived: ${successful}`);
    console.log(`Already archived: ${skipped}`);
    console.log(`Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed files:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.originalPath}: ${r.error}`);
      });
    }
    
    // Save detailed results
    const reportPath = 'docs/archived/sql/migrations/archive-report-supabase.json';
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Error during archival process:', error);
    throw error;
  }
}

// Run the archival
archiveSupabaseSqlFiles()
  .then(() => {
    console.log('\n✓ Archival process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Archival process failed:', error);
    process.exit(1);
  });
