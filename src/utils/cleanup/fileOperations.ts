import * as fs from 'fs/promises';
import * as path from 'path';
import { FileType, UnusedFile } from './unusedFileDetector';

/**
 * Get file statistics
 */
export async function getFileStats(filePath: string): Promise<{ size: number; lastModified: Date }> {
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    lastModified: stats.mtime,
  };
}

/**
 * Determine file type based on path and extension
 */
export function determineFileType(filePath: string): FileType {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();
  const dirname = path.dirname(filePath);

  // Check for specific patterns
  if (basename.includes('backup') || basename.includes('.bak')) {
    return 'other';
  }

  if (dirname.includes('pages')) {
    return 'page';
  }

  if (dirname.includes('components')) {
    return 'component';
  }

  // Check by extension
  switch (ext) {
    case '.sql':
      return 'sql';
    case '.html':
      return 'html';
    case '.md':
      return 'markdown';
    case '.js':
    case '.bat':
      return 'script';
    case '.json':
    case '.toml':
    case '.config':
      return 'config';
    case '.tsx':
    case '.ts':
      if (dirname.includes('pages')) return 'page';
      if (dirname.includes('components')) return 'component';
      return 'component';
    default:
      return 'other';
  }
}

/**
 * Create an UnusedFile object from a file path
 */
export async function createUnusedFile(filePath: string): Promise<UnusedFile> {
  const stats = await getFileStats(filePath);
  const type = determineFileType(filePath);

  return {
    path: filePath,
    type,
    size: stats.size,
    lastModified: stats.lastModified,
  };
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a file safely
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file content
 */
export async function readFileContent(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Get category directory name for a file type
 */
export function getCategoryForFileType(type: FileType): string {
  switch (type) {
    case 'page':
      return 'pages';
    case 'component':
      return 'components';
    case 'script':
      return 'scripts';
    case 'sql':
      return 'sql';
    case 'html':
      return 'html-tests';
    case 'markdown':
      return 'markdown-docs';
    case 'config':
      return 'backups';
    case 'other':
      return 'backups';
    default:
      return 'backups';
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
