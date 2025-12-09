import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileType, UnusedFile } from './unusedFileDetector';

// Re-export types from unusedFileDetector for consistency
export type { FileType, UnusedFile } from './unusedFileDetector';

export interface ArchiveResult {
  originalPath: string;
  archivePath: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  purpose?: string;
}

export interface Manifest {
  version: string;
  timestamp: Date;
  files: ArchiveResult[];
  summary: {
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, number>;
  };
}

export class FileArchiver {
  private archiveBaseDir: string;
  private archivedFiles: ArchiveResult[] = [];

  constructor(archiveBaseDir: string = 'docs/archived') {
    this.archiveBaseDir = archiveBaseDir;
  }

  /**
   * Create the archive directory structure
   */
  async createArchiveStructure(): Promise<void> {
    const directories = [
      this.archiveBaseDir,
      path.join(this.archiveBaseDir, 'pages'),
      path.join(this.archiveBaseDir, 'components'),
      path.join(this.archiveBaseDir, 'scripts'),
      path.join(this.archiveBaseDir, 'sql'),
      path.join(this.archiveBaseDir, 'sql', 'migrations'),
      path.join(this.archiveBaseDir, 'sql', 'supabase'),
      path.join(this.archiveBaseDir, 'html-tests'),
      path.join(this.archiveBaseDir, 'backups'),
      path.join(this.archiveBaseDir, 'markdown-docs'),
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Archive a single file to the appropriate category directory
   */
  async archiveFile(file: UnusedFile, category: string): Promise<ArchiveResult> {
    const result: ArchiveResult = {
      originalPath: file.path,
      archivePath: '',
      timestamp: new Date(),
      success: false,
    };

    try {
      // Calculate archive path
      const fileName = path.basename(file.path);
      const archivePath = path.join(this.archiveBaseDir, category, fileName);
      result.archivePath = archivePath;

      // Ensure the category directory exists
      const categoryDir = path.join(this.archiveBaseDir, category);
      await fs.mkdir(categoryDir, { recursive: true });

      // Copy the file
      await fs.copyFile(file.path, archivePath);

      // Verify the copy
      const originalContent = await fs.readFile(file.path);
      const archivedContent = await fs.readFile(archivePath);
      
      if (Buffer.compare(originalContent, archivedContent) === 0) {
        result.success = true;
        this.archivedFiles.push(result);
      } else {
        result.error = 'File content verification failed';
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  }

  /**
   * Archive multiple files
   */
  async archiveFiles(files: Array<{ file: UnusedFile; category: string }>): Promise<ArchiveResult[]> {
    const results: ArchiveResult[] = [];
    
    for (const { file, category } of files) {
      const result = await this.archiveFile(file, category);
      results.push(result);
    }

    return results;
  }

  /**
   * Generate a manifest of all archived files
   */
  async generateManifest(archivedFiles?: ArchiveResult[]): Promise<Manifest> {
    const files = archivedFiles || this.archivedFiles;
    
    // Calculate summary statistics
    const byCategory: Record<string, number> = {};
    let totalSize = 0;

    for (const file of files) {
      if (file.success) {
        const category = path.dirname(file.archivePath).split(path.sep).pop() || 'unknown';
        byCategory[category] = (byCategory[category] || 0) + 1;

        try {
          const stats = await fs.stat(file.archivePath);
          totalSize += stats.size;
        } catch {
          // Skip if file doesn't exist
        }
      }
    }

    const manifest: Manifest = {
      version: '1.0.0',
      timestamp: new Date(),
      files,
      summary: {
        totalFiles: files.filter(f => f.success).length,
        totalSize,
        byCategory,
      },
    };

    return manifest;
  }

  /**
   * Save manifest to disk
   */
  async saveManifest(manifest: Manifest): Promise<void> {
    const manifestPath = path.join(this.archiveBaseDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  /**
   * Load manifest from disk
   */
  async loadManifest(): Promise<Manifest | null> {
    try {
      const manifestPath = path.join(this.archiveBaseDir, 'manifest.json');
      const content = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Get all archived files
   */
  getArchivedFiles(): ArchiveResult[] {
    return [...this.archivedFiles];
  }

  /**
   * Clear the archived files list
   */
  clearArchivedFiles(): void {
    this.archivedFiles = [];
  }
}
