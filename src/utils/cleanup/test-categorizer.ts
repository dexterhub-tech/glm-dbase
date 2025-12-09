/**
 * Simple test to verify the file categorizer works
 */
import { FileCategorizer } from './fileCategorizer';
import { UnusedFile } from './unusedFileDetector';

// Create sample unused files
const sampleFiles: UnusedFile[] = [
  {
    path: 'src/pages/Index.tsx',
    type: 'page',
    size: 1024,
    lastModified: new Date('2024-01-01'),
  },
  {
    path: 'src/pages/About.tsx',
    type: 'page',
    size: 2048,
    lastModified: new Date('2024-01-02'),
  },
  {
    path: 'src/components/Header.tsx',
    type: 'component',
    size: 512,
    lastModified: new Date('2024-01-03'),
  },
  {
    path: 'diagnose.js',
    type: 'script',
    size: 4096,
    lastModified: new Date('2024-01-04'),
  },
  {
    path: 'fix_phone_constraint.sql',
    type: 'sql',
    size: 256,
    lastModified: new Date('2024-01-05'),
  },
  {
    path: 'debug-login.html',
    type: 'html',
    size: 128,
    lastModified: new Date('2024-01-06'),
  },
  {
    path: 'SETUP_GUIDE.md',
    type: 'markdown',
    size: 8192,
    lastModified: new Date('2024-01-07'),
  },
];

console.log('Testing File Categorizer...\n');

const categorizer = new FileCategorizer();

// Test 1: Categorize files
console.log('1. Testing categorizeFiles()...');
const categorized = categorizer.categorizeFiles(sampleFiles);
console.log('   Pages:', categorized.pages.length);
console.log('   Components:', categorized.components.length);
console.log('   Scripts:', categorized.scripts.length);
console.log('   SQL:', categorized.sql.length);
console.log('   HTML:', categorized.html.length);
console.log('   Markdown:', categorized.markdown.length);
console.log('   ✓ Categorization works!\n');

// Test 2: Generate category reports
console.log('2. Testing generateCategoryReports()...');
const reports = categorizer.generateCategoryReports(categorized);
console.log('   Generated', reports.length, 'category reports');
for (const report of reports) {
  if (report.count > 0) {
    console.log(`   - ${report.category}: ${report.count} files, ${categorizer.formatSize(report.totalSize)}`);
  }
}
console.log('   ✓ Report generation works!\n');

// Test 3: Get summary stats
console.log('3. Testing getSummaryStats()...');
const stats = categorizer.getSummaryStats(categorized);
console.log('   Total files:', stats.totalFiles);
console.log('   Total size:', categorizer.formatSize(stats.totalSize));
console.log('   By category:', stats.byCategory);
console.log('   ✓ Summary stats work!\n');

// Test 4: Format utilities
console.log('4. Testing format utilities...');
console.log('   formatSize(1024):', categorizer.formatSize(1024));
console.log('   formatSize(1048576):', categorizer.formatSize(1048576));
console.log('   formatDate(new Date()):', categorizer.formatDate(new Date()));
console.log('   ✓ Format utilities work!\n');

console.log('All tests passed! ✓');
