import * as fs from 'fs';
import * as path from 'path';

export interface FileNode {
  path: string;
  imports: string[];
  exists: boolean;
}

export interface ImportGraph {
  nodes: Map<string, FileNode>;
  edges: Map<string, string[]>;
}

/**
 * Builds an import graph starting from entry points
 */
export class ImportGraphBuilder {
  private graph: ImportGraph;
  private projectRoot: string;
  private visited: Set<string>;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
    };
    this.visited = new Set();
  }

  /**
   * Build import graph from entry points
   */
  public buildGraph(entryPoints: string[]): ImportGraph {
    for (const entryPoint of entryPoints) {
      const resolvedPath = this.resolvePath(entryPoint);
      if (resolvedPath) {
        this.traverseFile(resolvedPath);
      }
    }
    return this.graph;
  }

  /**
   * Traverse a file and its imports recursively
   */
  private traverseFile(filePath: string): void {
    // Normalize path
    const normalizedPath = path.normalize(filePath);
    
    // Skip if already visited
    if (this.visited.has(normalizedPath)) {
      return;
    }
    
    this.visited.add(normalizedPath);

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      this.graph.nodes.set(normalizedPath, {
        path: normalizedPath,
        imports: [],
        exists: false,
      });
      return;
    }

    // Parse imports from file
    const imports = this.parseImports(normalizedPath);
    
    // Add node to graph
    this.graph.nodes.set(normalizedPath, {
      path: normalizedPath,
      imports,
      exists: true,
    });

    // Add edges
    this.graph.edges.set(normalizedPath, imports);

    // Recursively traverse imports
    for (const importPath of imports) {
      const resolvedImport = this.resolveImport(normalizedPath, importPath);
      if (resolvedImport) {
        this.traverseFile(resolvedImport);
      }
    }
  }

  /**
   * Parse import statements from a file
   */
  private parseImports(filePath: string): string[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports: string[] = [];

      // Match static imports: import ... from '...'
      const staticImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = staticImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Match dynamic imports: import('...')
      const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // Match require statements: require('...')
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      return imports;
    } catch (error) {
      console.error(`Error parsing imports from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Resolve an import path relative to the importing file
   */
  private resolveImport(fromFile: string, importPath: string): string | null {
    // Skip node_modules imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importPath);

    // Try different extensions
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json'];
    
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
        return pathWithExt;
      }
    }

    // Try index files
    const indexExtensions = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    for (const indexExt of indexExtensions) {
      const indexPath = resolvedPath + indexExt;
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  /**
   * Resolve a path relative to project root
   */
  private resolvePath(filePath: string): string | null {
    const resolved = path.resolve(this.projectRoot, filePath);
    
    // Try different extensions
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
    
    for (const ext of extensions) {
      const pathWithExt = resolved + ext;
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    return null;
  }

  /**
   * Get all reachable files from the graph
   */
  public getReachableFiles(): Set<string> {
    return new Set(this.graph.nodes.keys());
  }
}
