import * as fs from 'fs';
import * as path from 'path';
import { FileAnalyzer } from './fileAnalyzer';

/**
 * Run the file analysis and generate reports
 */
async function runAnalysis() {
  // Get project root (3 levels up from this file)
  const projectRoot = path.resolve(__dirname, '../../..');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PROJECT CLEANUP ANALYSIS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`Project root: ${projectRoot}`);
  console.log('');

  // Define entry points
  const entryPoints = [
    'src/main.tsx',
    'src/App.tsx',
  ];

  console.log('Entry points:');
  entryPoints.forEach(ep => console.log(`  - ${ep}`));
  console.log('');

  // Create analyzer
  const analyzer = new FileAnalyzer(projectRoot);

  // Run analysis
  const { report } = analyzer.analyzeProject(entryPoints);

  // Display console report
  console.log(analyzer.getConsoleReport(report));

  // Save reports to files
  const reportsDir = path.join(projectRoot, 'docs', 'cleanup-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save markdown report
  const markdownPath = path.join(reportsDir, 'analysis-report.md');
  fs.writeFileSync(markdownPath, analyzer.getMarkdownReport(report));
  console.log(`\nMarkdown report saved to: ${path.relative(projectRoot, markdownPath)}`);

  // Save JSON report
  const jsonPath = path.join(reportsDir, 'analysis-report.json');
  fs.writeFileSync(jsonPath, analyzer.getJsonReport(report));
  console.log(`JSON report saved to: ${path.relative(projectRoot, jsonPath)}`);

  console.log('');
  console.log('Analysis complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review the reports in docs/cleanup-reports/');
  console.log('  2. Verify the list of unused files');
  console.log('  3. Proceed with archival when ready');
}

export { runAnalysis };

// Run if called directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  runAnalysis().catch(error => {
    console.error('Error running analysis:', error);
    process.exit(1);
  });
}
