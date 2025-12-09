import * as fs from 'fs/promises';

async function verifyArchive() {
  const filesToVerify = [
    { original: 'src/pages/Index.tsx', archived: 'docs/archived/pages/Index.tsx' },
    { original: 'src/components/Header.tsx', archived: 'docs/archived/components/Header.tsx' },
  ];

  console.log('Verifying archived files...\n');

  let allMatch = true;

  for (const { original, archived } of filesToVerify) {
    try {
      const originalContent = await fs.readFile(original);
      const archivedContent = await fs.readFile(archived);

      if (Buffer.compare(originalContent, archivedContent) === 0) {
        console.log(`✓ ${original} matches ${archived}`);
      } else {
        console.log(`✗ ${original} does NOT match ${archived}`);
        allMatch = false;
      }
    } catch (error) {
      console.log(`✗ Error verifying ${original}: ${error}`);
      allMatch = false;
    }
  }

  console.log('\n' + (allMatch ? 'All files verified successfully!' : 'Some files failed verification'));
  return allMatch;
}

verifyArchive()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
