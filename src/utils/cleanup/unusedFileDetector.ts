import * as fs from 'fs';
import * as path from 'path';
import { ImportGraph } from './importGraphBuilder';

export interface UnusedFile {
  path: string;
  type: FileType;
  size: number;
  lastModified: Date;
  purpose?: string;
}

export type FileType = 
  | 'component' 
  | 'page' 
  | 'script' 
  | 'sql' 
  | 'html' 
  | 'markdown' 
  | 'config'
  | 'other';

/**
 * Detects unused files by comparing all project files against the import graph
 */
export class UnusedFileDetector {
  private projectRoot: string;
  private excludePatterns: RegExp[];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.excludePatterns = this.getExcludePatterns();
  }

  /**
   * Get patterns for files to exclude from analysis
   */
  private getExcludePatterns(): RegExp[] {
    return [
      // Node modules
      /node_modules/,
      // Build output
      /dist\//,
      /build\//,
      // Git
      /\.git\//,
      // Config files
      /package\.json$/,
      /package-lock\.json$/,
      /pnpm-lock\.yaml$/,
      /bun\.lockb$/,
      /tsconfig.*\.json$/,
      /vite\.config\./,
      /tailwind\.config\./,
      /postcss\.config\./,
      /eslint\.config\./,
      /components\.json$/,
      /vercel\.json$/,
      // Environment files
      /\.env/,
      // Lock files and logs
      /\.log$/,
      // README and main docs
      /^README\.md$/,
      // Index HTML
      /index\.html$/,
      // Manifest
      /manifest\.json$/,
      // Images and assets
      /\.(png|jpg|jpeg|gif|svg|ico)$/,
    ];
  }

  /**
   * Find all files in the project
   */
  private getAllProjectFiles(): string[] {
    const files: string[] = [];
    
    const traverse = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(this.projectRoot, fullPath);
          
          // Skip excluded patterns
          if (this.shouldExclude(relativePath)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
      }
    };
    
    traverse(this.projectRoot);
    return files;
  }

  /**
   * Check if a file should be excluded from analysis
   */
  private shouldExclude(relativePath: string): boolean {
    return this.excludePatterns.some(pattern => pattern.test(relativePath));
  }

  /**
   * Find unused files by comparing all files against reachable files
   */
  public findUnusedFiles(importGraph: ImportGraph): UnusedFile[] {
    const allFiles = this.getAllProjectFiles();
    const reachableFiles = new Set(importGraph.nodes.keys());
    const unusedFiles: UnusedFile[] = [];

    for (const filePath of allFiles) {
      const normalizedPath = path.normalize(filePath);
      
      // Skip if file is reachable through imports
      if (reachableFiles.has(normalizedPath)) {
        continue;
      }

      // Get file stats
      try {
        const stats = fs.statSync(normalizedPath);
        const fileType = this.determineFileType(normalizedPath);
        
        unusedFiles.push({
          path: normalizedPath,
          type: fileType,
          size: stats.size,
          lastModified: stats.mtime,
        });
      } catch (error) {
        console.error(`Error getting stats for ${normalizedPath}:`, error);
      }
    }

    return unusedFiles;
  }

  /**
   * Determine the type of a file based on its path and extension
   */
  private determineFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    const relativePath = path.relative(this.projectRoot, filePath);

    // SQL files
    if (ext === '.sql') {
      return 'sql';
    }

    // HTML files
    if (ext === '.html') {
      return 'html';
    }

    // Markdown files
    if (ext === '.md') {
      return 'markdown';
    }

    // Script files (JS in root or specific directories)
    if (ext === '.js' && !relativePath.startsWith('src')) {
      return 'script';
    }

    // Batch files
    if (ext === '.bat') {
      return 'script';
    }

    // Config files
    if (basename.includes('config') || basename.startsWith('.')) {
      return 'config';
    }

    // Page components
    if (relativePath.includes('pages') && (ext === '.tsx' || ext === '.jsx')) {
      return 'page';
    }

    // React components
    if (ext === '.tsx' || ext === '.jsx') {
      return 'component';
    }

    return 'other';
  }
}
