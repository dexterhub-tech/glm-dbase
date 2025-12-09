import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Verify that archived page files match their originals byte-for-byte
 */
async function verifyPageArchival(): Promise<void> {
  const pageFiles = [
    'src/pages/Index.tsx',
    'src/pages/About.tsx',
    'src/pages/Events.tsx',
    'src/pages/Sermons.tsx',
    'src/pages/Contact.tsx',
    'src/pages/Partnership.tsx',
    'src/pages/Terms.tsx',
    'src/pages/EventDetail.tsx',
  ];

  console.log('Verifying archived page files...\n');

  let allMatch = true;
  const results: Array<{ file: string; match: boolean; error?: string }> = [];

  for (const originalPath of pageFiles) {
    const fileName = path.basename(originalPath);
    const archivePath = path.join('docs', 'archived', 'pages', fileName);

    try {
      // Read both files
      const originalContent = await fs.readFile(originalPath);
      const archivedContent = await fs.readFile(archivePath);

      // Compare byte-for-byte
      const match = Buffer.compare(originalContent, archivedContent) === 0;

      results.push({ file: fileName, match });

      if (match) {
        console.log(`✓ ${fileName} - Content verified (${originalContent.length} bytes)`);
      } else {
        console.log(`✗ ${fileName} - Content mismatch!`);
        allMatch = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`✗ ${fileName} - Error: ${errorMessage}`);
      results.push({ file: fileName, match: false, error: errorMessage });
      allMatch = false;
    }
  }

  console.log('\n=== Verification Summary ===');
  console.log(`Total files checked: ${pageFiles.length}`);
  console.log(`Files verified: ${results.filter(r => r.match).length}`);
  console.log(`Files with issues: ${results.filter(r => !r.match).length}`);

  if (allMatch) {
    console.log('\n✓ All page files successfully archived with content preservation!');
    process.exit(0);
  } else {
    console.log('\n✗ Some files have verification issues. Please review.');
    process.exit(1);
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  verifyPageArchival().catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { verifyPageArchival };
