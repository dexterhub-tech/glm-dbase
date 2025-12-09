import * as path from 'path';
import { ImportGraphBuilder, ImportGraph } from './importGraphBuilder';
import { UnusedFileDetector, UnusedFile } from './unusedFileDetector';
import { FileCategorizer, CategorizedFiles } from './fileCategorizer';
import { AnalysisReportGenerator, AnalysisReport } from './analysisReportGenerator';

/**
 * Main file analyzer that orchestrates the analysis process
 */
export class FileAnalyzer {
  private projectRoot: string;
  private graphBuilder: ImportGraphBuilder;
  private unusedDetector: UnusedFileDetector;
  private categorizer: FileCategorizer;
  private reportGenerator: AnalysisReportGenerator;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.graphBuilder = new ImportGraphBuilder(projectRoot);
    this.unusedDetector = new UnusedFileDetector(projectRoot);
    this.categorizer = new FileCategorizer();
    this.reportGenerator = new AnalysisReportGenerator(projectRoot);
  }

  /**
   * Run complete analysis
   */
  public analyzeProject(entryPoints: string[]): {
    importGraph: ImportGraph;
    unusedFiles: UnusedFile[];
    categorizedFiles: CategorizedFiles;
    report: AnalysisReport;
  } {
    console.log('Building import graph...');
    const importGraph = this.graphBuilder.buildGraph(entryPoints);
    console.log(`Found ${importGraph.nodes.size} reachable files`);

    console.log('Detecting unused files...');
    const unusedFiles = this.unusedDetector.findUnusedFiles(importGraph);
    console.log(`Found ${unusedFiles.length} unused files`);

    console.log('Categorizing files...');
    const categorizedFiles = this.categorizer.categorizeFiles(unusedFiles);

    console.log('Generating report...');
    const report = this.reportGenerator.generateReport(categorizedFiles);

    return {
      importGraph,
      unusedFiles,
      categorizedFiles,
      report,
    };
  }

  /**
   * Get markdown report
   */
  public getMarkdownReport(report: AnalysisReport): string {
    return this.reportGenerator.generateMarkdownReport(report);
  }

  /**
   * Get JSON report
   */
  public getJsonReport(report: AnalysisReport): string {
    return this.reportGenerator.generateJsonReport(report);
  }

  /**
   * Get console report
   */
  public getConsoleReport(report: AnalysisReport): string {
    return this.reportGenerator.generateConsoleReport(report);
  }
}

// Export all types and classes
export * from './importGraphBuilder';
export * from './unusedFileDetector';
export * from './fileCategorizer';
export * from './analysisReportGenerator';
