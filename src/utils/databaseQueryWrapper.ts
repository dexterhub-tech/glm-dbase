/**
 * Database Query Wrapper with Performance Monitoring
 * 
 * Wraps Supabase queries with automatic performance monitoring, error logging,
 * and bottleneck detection. Provides comprehensive debugging information for
 * database operations.
 * 
 * Requirements: 3.3, 3.4
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  performanceMonitor, 
  logDatabaseError, 
  startMeasurement, 
  endMeasurement,
  captureDebugContext,
  reportBottleneck
} from './performanceMonitoring';
import type { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';

export interface QueryOptions {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  timeout?: number;
  retryCount?: number;
  enablePerformanceMonitoring?: boolean;
  context?: Record<string, any>;
}

export interface QueryResult<T = any> {
  data: T | null;
  error: any;
  count?: number | null;
  performanceId?: string;
  duration?: number;
  retryAttempts?: number;
}

// Default configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_COUNT = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Progressive delays in ms

class DatabaseQueryWrapper {
  /**
   * Execute a Supabase query with performance monitoring and error handling
   */
  public async executeQuery<T = any>(
    queryBuilder: () => PostgrestQueryBuilder<any, any, any> | PostgrestFilterBuilder<any, any, any, any, any>,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    const {
      table,
      operation,
      timeout = DEFAULT_TIMEOUT,
      retryCount = DEFAULT_RETRY_COUNT,
      enablePerformanceMonitoring = true,
      context = {}
    } = options;

    let performanceId: string | undefined;
    let retryAttempts = 0;
    let lastError: any = null;

    // Start performance measurement
    if (enablePerformanceMonitoring) {
      performanceId = startMeasurement(
        `db_${operation}_${table}`,
        'database',
        {
          table,
          operation,
          timeout,
          maxRetries: retryCount,
          ...context
        },
        ['database', operation, table]
      );
    }

    const executeWithRetry = async (): Promise<QueryResult<T>> => {
      try {
        // Create the query
        const query = queryBuilder();
        
        // Add timeout wrapper
        const queryPromise = this.executeWithTimeout(query, timeout);
        
        // Execute the query
        const startTime = Date.now();
        const result = await queryPromise;
        const duration = Date.now() - startTime;
        
        // End performance measurement on success
        if (performanceId) {
          endMeasurement(performanceId, {
            success: true,
            recordCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
            hasCount: result.count !== undefined,
            retryAttempts
          });
        }

        // Check for performance issues
        if (enablePerformanceMonitoring && duration > 2000) { // 2 second threshold
          reportBottleneck({
            type: 'slow_query',
            severity: duration > 10000 ? 'critical' : duration > 5000 ? 'high' : 'medium',
            description: `Slow ${operation} query on ${table} table`,
            metrics: { duration, recordCount: Array.isArray(result.data) ? result.data.length : 1 },
            affectedOperations: [`${operation}_${table}`],
            recommendations: [
              'Consider adding database indexes',
              'Optimize query filters and joins',
              'Check for table locks or high load',
              'Review query execution plan'
            ]
          });
        }

        return {
          ...result,
          performanceId,
          duration,
          retryAttempts
        };

      } catch (error: any) {
        lastError = error;
        retryAttempts++;

        const duration = Date.now() - (performanceId ? performance.now() : Date.now());

        // Log the database error
        logDatabaseError(
          this.extractQueryInfo(queryBuilder),
          error,
          {
            table,
            operation,
            duration,
            retryCount: retryAttempts,
            additionalContext: {
              timeout,
              maxRetries: retryCount,
              ...context
            }
          }
        );

        // Check if we should retry
        if (retryAttempts < retryCount && this.isRetryableError(error)) {
          const delay = RETRY_DELAYS[Math.min(retryAttempts - 1, RETRY_DELAYS.length - 1)];
          
          console.warn(`Database query failed, retrying in ${delay}ms (attempt ${retryAttempts}/${retryCount}):`, {
            table,
            operation,
            error: error.message,
            retryAttempts
          });

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry
          return executeWithRetry();
        }

        // All retries exhausted or non-retryable error
        if (performanceId) {
          endMeasurement(performanceId, {
            success: false,
            error: error.message,
            errorCode: error.code,
            retryAttempts,
            finalError: true
          });
        }

        // Capture debug context for failed queries
        if (enablePerformanceMonitoring) {
          captureDebugContext({
            operation: `failed_${operation}_${table}`,
            authState: null, // Will be populated by the context if available
            networkState: null // Will be populated by the context if available
          });
        }

        // Report critical database errors as bottlenecks
        if (this.isCriticalError(error) || retryAttempts >= retryCount) {
          reportBottleneck({
            type: 'slow_query',
            severity: 'critical',
            description: `Database ${operation} operation failed on ${table} after ${retryAttempts} retries`,
            metrics: { retryAttempts, duration },
            affectedOperations: [`${operation}_${table}`],
            recommendations: [
              'Check database connectivity',
              'Verify table permissions',
              'Check for database locks',
              'Review query syntax and parameters',
              'Contact database administrator if issue persists'
            ]
          });
        }

        return {
          data: null,
          error,
          performanceId,
          duration,
          retryAttempts
        };
      }
    };

    return executeWithRetry();
  }

  /**
   * Convenience method for SELECT queries
   */
  public async select<T = any>(
    table: string,
    queryFn: (builder: any) => any,
    options?: Partial<QueryOptions>
  ): Promise<QueryResult<T[]>> {
    return this.executeQuery<T[]>(
      () => queryFn((supabase as any).from(table).select()),
      {
        table,
        operation: 'select',
        ...options
      }
    );
  }

  /**
   * Convenience method for INSERT queries
   */
  public async insert<T = any>(
    table: string,
    data: any | any[],
    options?: Partial<QueryOptions>
  ): Promise<QueryResult<T[]>> {
    return this.executeQuery<T[]>(
      () => (supabase as any).from(table).insert(data).select(),
      {
        table,
        operation: 'insert',
        context: { recordCount: Array.isArray(data) ? data.length : 1 },
        ...options
      }
    );
  }

  /**
   * Convenience method for UPDATE queries
   */
  public async update<T = any>(
    table: string,
    data: any,
    filterFn: (builder: any) => any,
    options?: Partial<QueryOptions>
  ): Promise<QueryResult<T[]>> {
    return this.executeQuery<T[]>(
      () => filterFn((supabase as any).from(table).update(data)).select(),
      {
        table,
        operation: 'update',
        ...options
      }
    );
  }

  /**
   * Convenience method for DELETE queries
   */
  public async delete<T = any>(
    table: string,
    filterFn: (builder: any) => any,
    options?: Partial<QueryOptions>
  ): Promise<QueryResult<T[]>> {
    return this.executeQuery<T[]>(
      () => filterFn((supabase as any).from(table).delete()).select(),
      {
        table,
        operation: 'delete',
        ...options
      }
    );
  }

  /**
   * Convenience method for RPC calls
   */
  public async rpc<T = any>(
    functionName: string,
    params?: any,
    options?: Partial<QueryOptions>
  ): Promise<QueryResult<T>> {
    return this.executeQuery<T>(
      () => (supabase as any).rpc(functionName, params),
      {
        table: `rpc_${functionName}`,
        operation: 'rpc',
        context: { functionName, paramCount: params ? Object.keys(params).length : 0 },
        ...options
      }
    );
  }

  /**
   * Execute query with timeout
   */
  private async executeWithTimeout(query: any, timeoutMs: number): Promise<any> {
    return Promise.race([
      query,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are typically retryable
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return true;
    }

    // Timeout errors are retryable
    if (error.message?.includes('timeout')) {
      return true;
    }

    // Specific PostgreSQL error codes that are retryable
    const retryableCodes = [
      '08000', // connection_exception
      '08003', // connection_does_not_exist
      '08006', // connection_failure
      '53300', // too_many_connections
      '40001', // serialization_failure
      '40P01', // deadlock_detected
    ];

    return retryableCodes.includes(error.code);
  }

  /**
   * Check if an error is critical and needs immediate attention
   */
  private isCriticalError(error: any): boolean {
    // Authentication/permission errors
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      return true;
    }

    // Syntax errors
    if (error.code === '42601' || error.message?.includes('syntax error')) {
      return true;
    }

    // Table/column not found
    if (error.code === '42P01' || error.code === '42703') {
      return true;
    }

    return false;
  }

  /**
   * Extract query information for logging
   */
  private extractQueryInfo(queryBuilder: () => any): string {
    try {
      // This is a simplified extraction - in a real implementation,
      // you might want to use query builder introspection
      const builderStr = queryBuilder.toString();
      
      // Extract table name and operation type from the function
      const tableMatch = builderStr.match(/from\(['"]([^'"]+)['"]\)/);
      const selectMatch = builderStr.match(/\.select\(/);
      const insertMatch = builderStr.match(/\.insert\(/);
      const updateMatch = builderStr.match(/\.update\(/);
      const deleteMatch = builderStr.match(/\.delete\(/);
      const rpcMatch = builderStr.match(/\.rpc\(['"]([^'"]+)['"]/);

      let operation = 'unknown';
      let table = 'unknown';

      if (rpcMatch) {
        operation = 'rpc';
        table = rpcMatch[1];
      } else {
        if (tableMatch) table = tableMatch[1];
        if (selectMatch) operation = 'select';
        else if (insertMatch) operation = 'insert';
        else if (updateMatch) operation = 'update';
        else if (deleteMatch) operation = 'delete';
      }

      return `${operation.toUpperCase()} from ${table}`;
    } catch (error) {
      return 'Query information unavailable';
    }
  }

  /**
   * Get query performance statistics
   */
  public getQueryStats(timeRangeMs: number = 5 * 60 * 1000): {
    totalQueries: number;
    averageDuration: number;
    errorRate: number;
    slowQueries: number;
    topSlowTables: Array<{ table: string; avgDuration: number; count: number }>;
  } {
    const summary = performanceMonitor.getPerformanceSummary(timeRangeMs);
    const dbMetrics = summary.metrics.filter(m => m.category === 'database');
    
    const totalQueries = dbMetrics.length;
    const completedQueries = dbMetrics.filter(m => m.duration !== undefined);
    const averageDuration = completedQueries.length > 0 
      ? completedQueries.reduce((sum, m) => sum + (m.duration || 0), 0) / completedQueries.length
      : 0;
    
    const errorRate = summary.databaseErrors.length / Math.max(totalQueries, 1);
    const slowQueries = completedQueries.filter(m => (m.duration || 0) > 2000).length;
    
    // Calculate top slow tables
    const tableStats = new Map<string, { totalDuration: number; count: number }>();
    
    completedQueries.forEach(metric => {
      const tableName = metric.metadata?.table || 'unknown';
      const duration = metric.duration || 0;
      
      if (!tableStats.has(tableName)) {
        tableStats.set(tableName, { totalDuration: 0, count: 0 });
      }
      
      const stats = tableStats.get(tableName)!;
      stats.totalDuration += duration;
      stats.count += 1;
    });
    
    const topSlowTables = Array.from(tableStats.entries())
      .map(([table, stats]) => ({
        table,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return {
      totalQueries,
      averageDuration,
      errorRate,
      slowQueries,
      topSlowTables
    };
  }
}

// Create singleton instance
export const dbQuery = new DatabaseQueryWrapper();

// Export convenience functions
export const selectQuery = <T = any>(
  table: string,
  queryFn: (builder: any) => any,
  options?: Partial<QueryOptions>
) => dbQuery.select<T>(table, queryFn, options);

export const insertQuery = <T = any>(
  table: string,
  data: any | any[],
  options?: Partial<QueryOptions>
) => dbQuery.insert<T>(table, data, options);

export const updateQuery = <T = any>(
  table: string,
  data: any,
  filterFn: (builder: any) => any,
  options?: Partial<QueryOptions>
) => dbQuery.update<T>(table, data, filterFn, options);

export const deleteQuery = <T = any>(
  table: string,
  filterFn: (builder: any) => any,
  options?: Partial<QueryOptions>
) => dbQuery.delete<T>(table, filterFn, options);

export const rpcQuery = <T = any>(
  functionName: string,
  params?: any,
  options?: Partial<QueryOptions>
) => dbQuery.rpc<T>(functionName, params, options);

export const getQueryStats = (timeRangeMs?: number) => dbQuery.getQueryStats(timeRangeMs);