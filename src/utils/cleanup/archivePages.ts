import { FileArchiver } from './fileArchiver';
import type { UnusedFile } from './unusedFileDetector';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Archive unused page components and UI components
 */
export async function archivePagesAndComponents(): Promise<void> {
  const archiver = new FileArchiver('docs/archived');

  // Ensure archive structure exists
  await archiver.createArchiveStructure();

  // Define unused page files
  const pageFiles: string[] = [
    'src/pages/Index.tsx',
    'src/pages/About.tsx',
    'src/pages/Events.tsx',
    'src/pages/Sermons.tsx',
    'src/pages/Contact.tsx',
    'src/pages/Partnership.tsx',
    'src/pages/Terms.tsx',
    'src/pages/EventDetail.tsx',
  ];

  // Define unused component files
  const componentFiles: string[] = [
    'src/components/Header.tsx',
    'src/components/Hero.tsx',
    'src/components/Footer.tsx',
    'src/components/EventCard.tsx',
    'src/components/SermonCard.tsx',
  ];

  console.log('Starting archival of unused pages and components...\n');

  // Archive page files
  console.log('Archiving page components...');
  const pageResults = await archiveFileList(archiver, pageFiles, 'pages');
  
  // Archive component files
  console.log('\nArchiving UI components...');
  const componentResults = await archiveFileList(archiver, componentFiles, 'components');

  // Combine all results
  const allResults = [...pageResults, ...componentResults];

  // Generate and save manifest
  console.log('\nGenerating manifest...');
  const manifest = await archiver.generateManifest(allResults);
  await archiver.saveManifest(manifest);

  // Print summary
  console.log('\n=== Archive Summary ===');
  console.log(`Total files archived: ${manifest.summary.totalFiles}`);
  console.log(`Total size: ${(manifest.summary.totalSize / 1024).toFixed(2)} KB`);
  console.log('\nBy category:');
  Object.entries(manifest.summary.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} files`);
  });

  // Print any failures
  const failures = allResults.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n=== Failures ===');
    failures.forEach(f => {
      console.log(`  ${f.originalPath}: ${f.error}`);
    });
  }

  console.log('\nArchival complete!');
  console.log(`Manifest saved to: docs/archived/manifest.json`);
}

/**
 * Helper function to archive a list of files
 */
async function archiveFileList(
  archiver: FileArchiver,
  files: string[],
  category: string
): Promise<Array<{
  originalPath: string;
  archivePath: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}>> {
  const results = [];

  for (const filePath of files) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Create UnusedFile object
      const unusedFile: UnusedFile = {
        path: filePath,
        type: category === 'pages' ? 'page' : 'component',
        size: stats.size,
        lastModified: stats.mtime,
      };

      // Archive the file
      console.log(`  Archiving: ${filePath}`);
      const result = await archiver.archiveFile(unusedFile, category);
      results.push(result);

      if (result.success) {
        console.log(`    ✓ Success: ${result.archivePath}`);
      } else {
        console.log(`    ✗ Failed: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`    ✗ Failed: ${errorMessage}`);
      results.push({
        originalPath: filePath,
        archivePath: '',
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      });
    }
  }

  return results;
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  archivePagesAndComponents()
    .then(() => {
      console.log('\nScript completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nScript failed:', error);
      process.exit(1);
    });
}
