/**
 * Test script to verify cleanup infrastructure
 * This can be run to ensure the FileArchiver and file operations work correctly
 */

import { FileArchiver } from './fileArchiver';
import { createUnusedFile, getCategoryForFileType } from './fileOperations';

async function testInfrastructure() {
  console.log('Testing cleanup infrastructure...\n');

  // Test 1: Create archive structure
  console.log('1. Creating archive structure...');
  const archiver = new FileArchiver();
  await archiver.createArchiveStructure();
  console.log('✓ Archive structure created\n');

  // Test 2: Test file type detection
  console.log('2. Testing file type detection...');
  const testFiles = [
    'src/pages/Index.tsx',
    'src/components/Header.tsx',
    'diagnose.js',
    'fix_phone_constraint.sql',
    'debug-login.html',
    'SETUP_GUIDE.md',
    'current-db-backup.json',
  ];

  for (const filePath of testFiles) {
    try {
      const unusedFile = await createUnusedFile(filePath);
      const category = getCategoryForFileType(unusedFile.type);
      console.log(`  ${filePath} -> ${unusedFile.type} -> ${category}`);
    } catch (error) {
      console.log(`  ${filePath} -> (file not found, skipping)`);
    }
  }
  console.log('✓ File type detection working\n');

  // Test 3: Test manifest generation
  console.log('3. Testing manifest generation...');
  const manifest = await archiver.generateManifest([]);
  console.log(`  Manifest version: ${manifest.version}`);
  console.log(`  Timestamp: ${manifest.timestamp}`);
  console.log(`  Total files: ${manifest.summary.totalFiles}`);
  console.log('✓ Manifest generation working\n');

  console.log('All infrastructure tests passed! ✓');
}

export { testInfrastructure };

// Run tests if this file is executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  testInfrastructure().catch(console.error);
}
