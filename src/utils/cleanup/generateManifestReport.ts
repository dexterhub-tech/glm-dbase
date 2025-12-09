import * as fs from 'fs/promises';
import * as path from 'path';
import type { Manifest } from './fileArchiver';

/**
 * Generate a human-readable report from the manifest
 */
export class ManifestReportGenerator {
  private manifestPath: string;

  constructor(manifestPath: string = 'docs/archived/manifest.json') {
    this.manifestPath = manifestPath;
  }

  /**
   * Load the manifest
   */
  async loadManifest(): Promise<Manifest> {
    const content = await fs.readFile(this.manifestPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate a markdown report
   */
  async generateMarkdownReport(): Promise<string> {
    const manifest = await this.loadManifest();
    
    const lines: string[] = [];
    
    lines.push('# Archive Manifest Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date(manifest.timestamp).toLocaleString()}`);
    lines.push(`**Version:** ${manifest.version}`);
    lines.push('');
    
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Files Archived:** ${manifest.summary.totalFiles}`);
    lines.push(`- **Total Size:** ${this.formatBytes(manifest.summary.totalSize)}`);
    lines.push('');
    
    lines.push('## Files by Category');
    lines.push('');
    
    const sortedCategories = Object.entries(manifest.summary.byCategory)
      .sort(([, a], [, b]) => b - a);
    
    for (const [category, count] of sortedCategories) {
      lines.push(`- **${category}:** ${count} files`);
    }
    lines.push('');
    
    lines.push('## Detailed File List');
    lines.push('');
    
    // Group files by category
    const filesByCategory = new Map<string, typeof manifest.files>();
    
    for (const file of manifest.files) {
      const category = path.dirname(file.archivePath).split(path.sep).pop() || 'unknown';
      if (!filesByCategory.has(category)) {
        filesByCategory.set(category, []);
      }
      filesByCategory.get(category)!.push(file);
    }
    
    // Sort categories by file count (descending)
    const sortedCategoryEntries = Array.from(filesByCategory.entries())
      .sort(([, a], [, b]) => b.length - a.length);
    
    for (const [category, files] of sortedCategoryEntries) {
      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} (${files.length} files)`);
      lines.push('');
      
      // Sort files by original path
      const sortedFiles = files.sort((a, b) => 
        a.originalPath.localeCompare(b.originalPath)
      );
      
      for (const file of sortedFiles) {
        lines.push(`- **Original:** \`${file.originalPath}\``);
        lines.push(`  - **Archived:** \`${file.archivePath}\``);
        lines.push(`  - **Date:** ${new Date(file.timestamp).toLocaleString()}`);
        if (file.purpose) {
          lines.push(`  - **Purpose:** ${file.purpose}`);
        }
        lines.push('');
      }
    }
    
    lines.push('## Archive Structure');
    lines.push('');
    lines.push('```');
    lines.push('docs/archived/');
    lines.push('├── backups/          # Backup and temporary files');
    lines.push('├── components/       # Unused React components');
    lines.push('├── html-tests/       # HTML test and debug files');
    lines.push('├── markdown-docs/    # Archived documentation files');
    lines.push('├── pages/            # Unused page components');
    lines.push('├── scripts/          # Diagnostic and setup scripts');
    lines.push('├── sql/              # SQL migration and setup files');
    lines.push('│   ├── migrations/   # Supabase migration files');
    lines.push('│   └── supabase/     # Supabase setup files');
    lines.push('└── manifest.json     # This manifest file');
    lines.push('```');
    lines.push('');
    
    lines.push('## Notes');
    lines.push('');
    lines.push('- All archived files have been verified for content integrity');
    lines.push('- Original file paths are preserved in the manifest for reference');
    lines.push('- Files can be restored from the archive if needed');
    lines.push('- The archive structure mirrors the original organization for easy navigation');
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Save the markdown report
   */
  async saveMarkdownReport(outputPath: string = 'docs/archived/MANIFEST_REPORT.md'): Promise<void> {
    const report = await this.generateMarkdownReport();
    await fs.writeFile(outputPath, report, 'utf-8');
    console.log(`Report saved to ${outputPath}`);
  }
}

/**
 * Main function to generate the report
 */
async function main() {
  const generator = new ManifestReportGenerator();
  await generator.saveMarkdownReport();
  console.log('✓ Manifest report generated successfully!');
}

// Run the main function
main().catch(console.error);
