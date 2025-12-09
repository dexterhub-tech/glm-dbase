import { UnusedFile, FileType } from './unusedFileDetector';

export interface CategorizedFiles {
  pages: UnusedFile[];
  components: UnusedFile[];
  scripts: UnusedFile[];
  sql: UnusedFile[];
  html: UnusedFile[];
  markdown: UnusedFile[];
  config: UnusedFile[];
  other: UnusedFile[];
}

export interface CategoryReport {
  category: string;
  count: number;
  totalSize: number;
  files: UnusedFile[];
}

/**
 * Categorizes unused files by type and generates reports
 */
export class FileCategorizer {
  /**
   * Categorize files by type
   */
  public categorizeFiles(files: UnusedFile[]): CategorizedFiles {
    const categorized: CategorizedFiles = {
      pages: [],
      components: [],
      scripts: [],
      sql: [],
      html: [],
      markdown: [],
      config: [],
      other: [],
    };

    for (const file of files) {
      switch (file.type) {
        case 'page':
          categorized.pages.push(file);
          break;
        case 'component':
          categorized.components.push(file);
          break;
        case 'script':
          categorized.scripts.push(file);
          break;
        case 'sql':
          categorized.sql.push(file);
          break;
        case 'html':
          categorized.html.push(file);
          break;
        case 'markdown':
          categorized.markdown.push(file);
          break;
        case 'config':
          categorized.config.push(file);
          break;
        default:
          categorized.other.push(file);
      }
    }

    return categorized;
  }

  /**
   * Generate category reports with statistics
   */
  public generateCategoryReports(categorized: CategorizedFiles): CategoryReport[] {
    const reports: CategoryReport[] = [];

    const categories: Array<keyof CategorizedFiles> = [
      'pages',
      'components',
      'scripts',
      'sql',
      'html',
      'markdown',
      'config',
      'other',
    ];

    for (const category of categories) {
      const files = categorized[category];
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      reports.push({
        category,
        count: files.length,
        totalSize,
        files,
      });
    }

    // Sort by count descending
    reports.sort((a, b) => b.count - a.count);

    return reports;
  }

  /**
   * Format file size in human-readable format
   */
  public formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Format date in readable format
   */
  public formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get summary statistics
   */
  public getSummaryStats(categorized: CategorizedFiles): {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, number>;
  } {
    let totalFiles = 0;
    let totalSize = 0;
    const byCategory: Record<string, number> = {};

    const categories: Array<keyof CategorizedFiles> = [
      'pages',
      'components',
      'scripts',
      'sql',
      'html',
      'markdown',
      'config',
      'other',
    ];

    for (const category of categories) {
      const files = categorized[category];
      const count = files.length;
      const size = files.reduce((sum, file) => sum + file.size, 0);

      totalFiles += count;
      totalSize += size;
      byCategory[category] = count;
    }

    return {
      totalFiles,
      totalSize,
      byCategory,
    };
  }
}
