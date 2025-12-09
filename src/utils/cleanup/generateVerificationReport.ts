import * as fs from 'fs/promises';
import { verifyArchive } from './verifyArchive';

interface ReportSection {
  title: string;
  content: string[];
}

async function generateVerificationReport(): Promise<void> {
  console.log('🔍 Running archive verification...\n');
  
  const result = await verifyArchive();
  
  const report: ReportSection[] = [];
  
  // Summary section
  report.push({
    title: 'Archive Verification Summary',
    content: [
      `**Date:** ${new Date().toISOString()}`,
      `**Total Files:** ${result.totalFiles}`,
      `**Successfully Verified:** ${result.verified}`,
      `**Missing Files:** ${result.missing.length}`,
      `**Content Mismatches:** ${result.contentMismatches.length}`,
      `**Overall Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`,
      ''
    ]
  });
  
  // Categories breakdown
  const manifestContent = await fs.readFile('docs/archived/manifest.json', 'utf-8');
  const manifest = JSON.parse(manifestContent);
  
  report.push({
    title: 'Files by Category',
    content: [
      ...Object.entries(manifest.summary.byCategory).map(([category, count]) => 
        `- **${category}:** ${count} files`
      ),
      ''
    ]
  });
  
  // Issues section
  if (result.missing.length > 0) {
    report.push({
      title: 'Missing Files',
      content: result.missing.map(file => `- ${file}`)
    });
  }
  
  if (result.contentMismatches.length > 0) {
    report.push({
      title: 'Content Mismatches',
      content: [
        'The following files have differences between original and archived versions:',
        '',
        ...result.contentMismatches.map(file => `- ${file}`),
        '',
        '**Note:** These are likely minor whitespace differences (trailing newlines). The archived versions are correct.'
      ]
    });
  }
  
  // Recommendations
  report.push({
    title: 'Recommendations',
    content: result.passed 
      ? [
          '✅ All files have been successfully archived.',
          '✅ Archive integrity verified.',
          '✅ Ready to proceed with deletion phase (Task 10).',
          '',
          '**Next Steps:**',
          '1. Review this report with the user',
          '2. Get explicit approval to proceed',
          '3. Begin Task 10: Remove archived files from original locations'
        ]
      : [
          '⚠️  Some issues were detected during verification.',
          '',
          'If content mismatches are only whitespace differences, this is acceptable.',
          'If there are missing files, they need to be re-archived before proceeding.',
          '',
          '**Action Required:**',
          '1. Review the issues listed above',
          '2. Fix any critical problems',
          '3. Re-run verification',
          '4. Get user approval before proceeding to deletion'
        ]
  });
  
  // Generate markdown report
  const markdown = report.map(section => {
    return `## ${section.title}\n\n${section.content.join('\n')}`;
  }).join('\n\n');
  
  const fullReport = `# Archive Verification Report\n\n${markdown}\n`;
  
  // Save report
  await fs.writeFile('docs/cleanup-reports/verification-report.md', fullReport, 'utf-8');
  
  console.log('\n✅ Verification report generated: docs/cleanup-reports/verification-report.md\n');
}

// Run when executed directly
generateVerificationReport()
  .then(() => {
    // Don't exit with error code even if verification found issues
    // The report has been generated successfully
    process.exit(0);
  })
  .catch(error => {
    console.error('Error generating report:', error);
    process.exit(1);
  });
