import * as fs from 'fs/promises';
import * as path from 'path';
import type { ArchiveResult, Manifest } from './fileArchiver';

interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
}

/**
 * Scans the archive directory and generates a comprehensive manifest
 */
export class ManifestGenerator {
  private archiveBaseDir: string;

  constructor(archiveBaseDir: string = 'docs/archived') {
    this.archiveBaseDir = archiveBaseDir;
  }

  /**
   * Recursively scan a directory and get all files
   */
  private async scanDirectory(dir: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Skip the manifest file itself and summary files
          if (entry.name === 'manifest.json' || 
              entry.name === '.gitkeep' ||
              entry.name.includes('SUMMARY.md')) {
            continue;
          }
          
          try {
            const stats = await fs.stat(fullPath);
            files.push({
              path: fullPath,
              size: stats.size,
              lastModified: stats.mtime,
            });
          } catch (error) {
            console.warn(`Could not stat file ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
    
    return files;
  }

  /**
   * Determine the category of a file based on its path
   */
  private getCategoryFromPath(filePath: string): string {
    const relativePath = path.relative(this.archiveBaseDir, filePath);
    const parts = relativePath.split(path.sep);
    
    if (parts.length > 0) {
      return parts[0];
    }
    
    return 'unknown';
  }

  /**
   * Infer the original path of an archived file
   */
  private inferOriginalPath(archivePath: string, category: string): string {
    const fileName = path.basename(archivePath);
    
    // Try to infer original path based on category
    switch (category) {
      case 'pages':
        return `src/pages/${fileName}`;
      case 'components':
        return `src/components/${fileName}`;
      case 'scripts':
        return fileName; // Root level
      case 'sql':
        return fileName; // Root level
      case 'migrations':
        return `src/integrations/supabase/${fileName}`;
      case 'supabase':
        return `supabase/${fileName}`;
      case 'html-tests':
        return fileName; // Root level
      case 'backups':
        // Try to infer from filename
        if (fileName.includes('AuthContext')) {
          return `src/contexts/${fileName}`;
        }
        if (fileName.includes('fix.js') || fileName.includes('mobile')) {
          return `src/${fileName}`;
        }
        return fileName;
      case 'markdown-docs':
        return fileName; // Root level
      default:
        return fileName;
    }
  }

  /**
   * Generate a comprehensive manifest from all archived files
   */
  async generateComprehensiveManifest(): Promise<Manifest> {
    console.log('Scanning archive directory...');
    const allFiles = await this.scanDirectory(this.archiveBaseDir);
    console.log(`Found ${allFiles.length} archived files`);

    // Convert to ArchiveResult format
    const archiveResults: ArchiveResult[] = allFiles.map(file => {
      const category = this.getCategoryFromPath(file.path);
      const originalPath = this.inferOriginalPath(file.path, category);
      
      return {
        originalPath,
        archivePath: file.path,
        timestamp: file.lastModified,
        success: true,
      };
    });

    // Calculate summary statistics
    const byCategory: Record<string, number> = {};
    let totalSize = 0;

    for (const file of allFiles) {
      const category = this.getCategoryFromPath(file.path);
      byCategory[category] = (byCategory[category] || 0) + 1;
      totalSize += file.size;
    }

    const manifest: Manifest = {
      version: '1.0.0',
      timestamp: new Date(),
      files: archiveResults,
      summary: {
        totalFiles: archiveResults.length,
        totalSize,
        byCategory,
      },
    };

    return manifest;
  }

  /**
   * Merge existing manifest with newly scanned files
   */
  async mergeWithExistingManifest(): Promise<Manifest> {
    let existingManifest: Manifest | null = null;
    
    try {
      const manifestPath = path.join(this.archiveBaseDir, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      existingManifest = JSON.parse(content);
      console.log(`Loaded existing manifest with ${existingManifest.files.length} entries`);
    } catch {
      console.log('No existing manifest found, creating new one');
    }

    // Scan all current files
    const newManifest = await this.generateComprehensiveManifest();

    // If we have an existing manifest, preserve additional metadata like 'purpose'
    if (existingManifest) {
      const existingMap = new Map(
        existingManifest.files.map(f => [f.archivePath, f])
      );

      newManifest.files = newManifest.files.map(newFile => {
        const existing = existingMap.get(newFile.archivePath);
        if (existing && existing.purpose) {
          return {
            ...newFile,
            purpose: existing.purpose,
            originalPath: existing.originalPath, // Prefer existing original path
          };
        }
        return newFile;
      });
    }

    return newManifest;
  }

  /**
   * Save manifest to disk
   */
  async saveManifest(manifest: Manifest): Promise<void> {
    const manifestPath = path.join(this.archiveBaseDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`Manifest saved to ${manifestPath}`);
  }

  /**
   * Generate and save a comprehensive manifest
   */
  async generateAndSave(): Promise<Manifest> {
    const manifest = await this.mergeWithExistingManifest();
    await this.saveManifest(manifest);
    return manifest;
  }

  /**
   * Print manifest summary to console
   */
  printSummary(manifest: Manifest): void {
    console.log('\n=== Archive Manifest Summary ===');
    console.log(`Version: ${manifest.version}`);
    console.log(`Generated: ${manifest.timestamp}`);
    console.log(`Total Files: ${manifest.summary.totalFiles}`);
    console.log(`Total Size: ${(manifest.summary.totalSize / 1024).toFixed(2)} KB`);
    console.log('\nFiles by Category:');
    
    const sortedCategories = Object.entries(manifest.summary.byCategory)
      .sort(([, a], [, b]) => b - a);
    
    for (const [category, count] of sortedCategories) {
      console.log(`  ${category}: ${count} files`);
    }
    console.log('================================\n');
  }
}
