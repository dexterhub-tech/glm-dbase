import * as path from 'path';
import { CategorizedFiles, CategoryReport, FileCategorizer } from './fileCategorizer';
import { UnusedFile } from './unusedFileDetector';

export interface AnalysisReport {
  timestamp: Date;
  summary: {
    totalFiles: number;
    totalSize: string;
    byCategory: Record<string, number>;
  };
  categories: CategoryReport[];
  detailedFiles: UnusedFile[];
}

/**
 * Generates human-readable analysis reports
 */
export class AnalysisReportGenerator {
  private categorizer: FileCategorizer;
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.categorizer = new FileCategorizer();
    this.projectRoot = projectRoot;
  }

  /**
   * Generate a complete analysis report
   */
  public generateReport(categorized: CategorizedFiles): AnalysisReport {
    const stats = this.categorizer.getSummaryStats(categorized);
    const categoryReports = this.categorizer.generateCategoryReports(categorized);
    
    // Flatten all files for detailed view
    const allFiles: UnusedFile[] = [
      ...categorized.pages,
      ...categorized.components,
      ...categorized.scripts,
      ...categorized.sql,
      ...categorized.html,
      ...categorized.markdown,
      ...categorized.config,
      ...categorized.other,
    ];

    return {
      timestamp: new Date(),
      summary: {
        totalFiles: stats.totalFiles,
        totalSize: this.categorizer.formatSize(stats.totalSize),
        byCategory: stats.byCategory,
      },
      categories: categoryReports,
      detailedFiles: allFiles,
    };
  }

  /**
   * Generate a markdown report
   */
  public generateMarkdownReport(report: AnalysisReport): string {
    const lines: string[] = [];

    // Header
    lines.push('# Project Cleanup Analysis Report');
    lines.push('');
    lines.push(`Generated: ${report.timestamp.toISOString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Unused Files**: ${report.summary.totalFiles}`);
    lines.push(`- **Total Size**: ${report.summary.totalSize}`);
    lines.push('');

    // Category breakdown
    lines.push('### Files by Category');
    lines.push('');
    for (const [category, count] of Object.entries(report.summary.byCategory)) {
      if (count > 0) {
        lines.push(`- **${this.capitalize(category)}**: ${count} files`);
      }
    }
    lines.push('');

    // Detailed category reports
    lines.push('## Detailed Analysis');
    lines.push('');

    for (const categoryReport of report.categories) {
      if (categoryReport.count === 0) continue;

      lines.push(`### ${this.capitalize(categoryReport.category)} (${categoryReport.count} files)`);
      lines.push('');
      lines.push(`Total size: ${this.categorizer.formatSize(categoryReport.totalSize)}`);
      lines.push('');

      // List files
      for (const file of categoryReport.files) {
        const relativePath = path.relative(this.projectRoot, file.path);
        const size = this.categorizer.formatSize(file.size);
        const date = this.categorizer.formatDate(file.lastModified);
        lines.push(`- \`${relativePath}\` (${size}, modified: ${date})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate a JSON report
   */
  public generateJsonReport(report: AnalysisReport): string {
    // Convert file paths to relative paths for readability
    const reportWithRelativePaths = {
      ...report,
      detailedFiles: report.detailedFiles.map(file => ({
        ...file,
        path: path.relative(this.projectRoot, file.path),
        lastModified: file.lastModified.toISOString(),
      })),
      categories: report.categories.map(cat => ({
        ...cat,
        files: cat.files.map(file => ({
          ...file,
          path: path.relative(this.projectRoot, file.path),
          lastModified: file.lastModified.toISOString(),
        })),
      })),
    };

    return JSON.stringify(reportWithRelativePaths, null, 2);
  }

  /**
   * Generate a console-friendly report
   */
  public generateConsoleReport(report: AnalysisReport): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════');
    lines.push('  PROJECT CLEANUP ANALYSIS REPORT');
    lines.push('═══════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Generated: ${report.timestamp.toLocaleString()}`);
    lines.push('');

    // Summary box
    lines.push('┌─────────────────────────────────────────────────────┐');
    lines.push('│ SUMMARY                                             │');
    lines.push('├─────────────────────────────────────────────────────┤');
    lines.push(`│ Total Unused Files: ${String(report.summary.totalFiles).padEnd(32)}│`);
    lines.push(`│ Total Size: ${report.summary.totalSize.padEnd(40)}│`);
    lines.push('└─────────────────────────────────────────────────────┘');
    lines.push('');

    // Category breakdown
    lines.push('FILES BY CATEGORY:');
    lines.push('');
    for (const categoryReport of report.categories) {
      if (categoryReport.count === 0) continue;
      
      const categoryName = this.capitalize(categoryReport.category);
      const size = this.categorizer.formatSize(categoryReport.totalSize);
      lines.push(`  ${categoryName.padEnd(15)} ${String(categoryReport.count).padStart(3)} files  (${size})`);
    }
    lines.push('');

    // Top files by size
    const sortedBySize = [...report.detailedFiles].sort((a, b) => b.size - a.size).slice(0, 10);
    if (sortedBySize.length > 0) {
      lines.push('TOP 10 LARGEST UNUSED FILES:');
      lines.push('');
      for (const file of sortedBySize) {
        const relativePath = path.relative(this.projectRoot, file.path);
        const size = this.categorizer.formatSize(file.size);
        lines.push(`  ${size.padStart(10)}  ${relativePath}`);
      }
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
