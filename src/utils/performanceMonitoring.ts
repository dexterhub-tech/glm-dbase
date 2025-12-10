/**
 * Performance Monitoring and Logging Utility
 * 
 * Provides comprehensive performance metrics collection, database query error logging,
 * debugging information capture, and bottleneck identification for the authentication system.
 * 
 * Requirements: 3.3, 3.4
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  absoluteStartTime: number; // Date.now() timestamp for filtering
  endTime?: number;
  duration?: number;
  category: 'auth' | 'database' | 'network' | 'ui' | 'general';
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface DatabaseError {
  id: string;
  timestamp: Date;
  query: string;
  table?: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'unknown';
  error: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  context?: Record<string, any>;
  duration?: number;
  retryCount?: number;
}

export interface PerformanceBottleneck {
  id: string;
  timestamp: Date;
  type: 'slow_query' | 'high_latency' | 'memory_usage' | 'cpu_usage' | 'network_delay';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: Record<string, number>;
  affectedOperations: string[];
  recommendations: string[];
}

export interface DebugContext {
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  userAgent: string;
  url: string;
  networkState?: any;
  authState?: any;
  performanceMetrics?: PerformanceMetric[];
  recentErrors?: any[];
}

// Performance thresholds for bottleneck detection
const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 2000,
  HIGH_LATENCY_MS: 1000,
  CRITICAL_LATENCY_MS: 3000,
  AUTH_TIMEOUT_MS: 5000,
  DATABASE_TIMEOUT_MS: 10000,
  UI_RENDER_MS: 100,
  MEMORY_USAGE_MB: 100,
} as const;

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private databaseErrors: DatabaseError[] = [];
  private bottlenecks: PerformanceBottleneck[] = [];
  private debugContexts: DebugContext[] = [];
  
  // Configuration
  private readonly MAX_STORED_METRICS = 1000;
  private readonly MAX_STORED_ERRORS = 500;
  private readonly MAX_STORED_BOTTLENECKS = 100;
  private readonly MAX_DEBUG_CONTEXTS = 50;
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
    this.initializePerformanceObserver();
  }

  /**
   * Start a performance measurement
   */
  public startMeasurement(
    name: string, 
    category: PerformanceMetric['category'] = 'general',
    metadata?: Record<string, any>,
    tags?: string[]
  ): string {
    const id = this.generateId();
    const metric: PerformanceMetric = {
      id,
      name,
      startTime: performance.now(),
      absoluteStartTime: Date.now(),
      category,
      metadata,
      tags,
    };
    
    this.metrics.set(id, metric);
    
    this.logPerformanceEvent('MEASUREMENT_STARTED', {
      id,
      name,
      category,
      metadata,
      tags
    });
    
    return id;
  }

  /**
   * End a performance measurement
   */
  public endMeasurement(id: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      this.logPerformanceEvent('MEASUREMENT_NOT_FOUND', { id });
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...additionalMetadata },
    };
    
    this.metrics.set(id, completedMetric);
    
    this.logPerformanceEvent('MEASUREMENT_COMPLETED', {
      id,
      name: metric.name,
      duration,
      category: metric.category
    });
    
    // Check for bottlenecks
    this.checkForBottlenecks(completedMetric);
    
    return completedMetric;
  }

  /**
   * Measure a function execution
   */
  public async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    category: PerformanceMetric['category'] = 'general',
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startMeasurement(name, category, metadata);
    
    try {
      const result = await fn();
      this.endMeasurement(id, { success: true });
      return result;
    } catch (error: any) {
      this.endMeasurement(id, { 
        success: false, 
        error: error.message,
        errorType: error.constructor.name 
      });
      throw error;
    }
  }

  /**
   * Log database query error with comprehensive context
   */
  public logDatabaseError(
    query: string,
    error: any,
    context?: {
      table?: string;
      operation?: DatabaseError['operation'];
      duration?: number;
      retryCount?: number;
      additionalContext?: Record<string, any>;
    }
  ): void {
    const dbError: DatabaseError = {
      id: this.generateId(),
      timestamp: new Date(),
      query: this.sanitizeQuery(query),
      table: context?.table,
      operation: context?.operation || 'unknown',
      error: {
        message: error.message || 'Unknown database error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      context: context?.additionalContext,
      duration: context?.duration,
      retryCount: context?.retryCount || 0,
    };
    
    this.databaseErrors.push(dbError);
    
    // Keep only recent errors
    if (this.databaseErrors.length > this.MAX_STORED_ERRORS) {
      this.databaseErrors = this.databaseErrors.slice(-this.MAX_STORED_ERRORS);
    }
    
    this.logPerformanceEvent('DATABASE_ERROR_LOGGED', {
      errorId: dbError.id,
      table: dbError.table,
      operation: dbError.operation,
      errorCode: dbError.error.code,
      duration: dbError.duration,
      retryCount: dbError.retryCount
    });
    
    // Check if this indicates a performance bottleneck
    if (dbError.duration && dbError.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
      this.reportBottleneck({
        type: 'slow_query',
        severity: dbError.duration > PERFORMANCE_THRESHOLDS.DATABASE_TIMEOUT_MS ? 'critical' : 'high',
        description: `Slow database query detected: ${dbError.table || 'unknown table'}`,
        metrics: { duration: dbError.duration },
        affectedOperations: [dbError.operation],
        recommendations: [
          'Consider adding database indexes',
          'Optimize query structure',
          'Check for table locks',
          'Monitor database performance'
        ]
      });
    }
  }

  /**
   * Capture comprehensive debugging context
   */
  public captureDebugContext(
    additionalContext?: {
      userId?: string;
      sessionId?: string;
      authState?: any;
      networkState?: any;
      operation?: string;
    }
  ): DebugContext {
    const context: DebugContext = {
      timestamp: new Date(),
      userId: additionalContext?.userId,
      sessionId: additionalContext?.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      networkState: additionalContext?.networkState,
      authState: this.sanitizeAuthState(additionalContext?.authState),
      performanceMetrics: this.getRecentMetrics(10),
      recentErrors: this.getRecentDatabaseErrors(5),
    };
    
    this.debugContexts.push(context);
    
    // Keep only recent contexts
    if (this.debugContexts.length > this.MAX_DEBUG_CONTEXTS) {
      this.debugContexts = this.debugContexts.slice(-this.MAX_DEBUG_CONTEXTS);
    }
    
    this.logPerformanceEvent('DEBUG_CONTEXT_CAPTURED', {
      userId: context.userId,
      sessionId: context.sessionId,
      operation: additionalContext?.operation,
      metricsCount: context.performanceMetrics?.length || 0,
      errorsCount: context.recentErrors?.length || 0
    });
    
    return context;
  }

  /**
   * Report a performance bottleneck
   */
  public reportBottleneck(bottleneck: Omit<PerformanceBottleneck, 'id' | 'timestamp'>): void {
    const fullBottleneck: PerformanceBottleneck = {
      id: this.generateId(),
      timestamp: new Date(),
      ...bottleneck,
    };
    
    this.bottlenecks.push(fullBottleneck);
    
    // Keep only recent bottlenecks
    if (this.bottlenecks.length > this.MAX_STORED_BOTTLENECKS) {
      this.bottlenecks = this.bottlenecks.slice(-this.MAX_STORED_BOTTLENECKS);
    }
    
    this.logPerformanceEvent('BOTTLENECK_REPORTED', {
      bottleneckId: fullBottleneck.id,
      type: fullBottleneck.type,
      severity: fullBottleneck.severity,
      description: fullBottleneck.description,
      metrics: fullBottleneck.metrics
    });
    
    // Log critical bottlenecks as errors for immediate attention
    if (fullBottleneck.severity === 'critical') {
      console.error('[PERFORMANCE CRITICAL]', fullBottleneck);
    }
  }

  /**
   * Get performance summary for a specific time period
   */
  public getPerformanceSummary(
    timeRangeMs: number = 5 * 60 * 1000 // Default: last 5 minutes
  ): {
    metrics: PerformanceMetric[];
    databaseErrors: DatabaseError[];
    bottlenecks: PerformanceBottleneck[];
    summary: {
      totalMeasurements: number;
      averageDuration: number;
      slowestOperation: PerformanceMetric | null;
      errorRate: number;
      criticalBottlenecks: number;
    };
  } {
    const cutoffTime = Date.now() - timeRangeMs;
    
    // Filter metrics by time range using absolute timestamps
    const recentMetrics = Array.from(this.metrics.values()).filter(
      metric => metric.absoluteStartTime >= cutoffTime
    );
    
    // Filter errors by time range
    const recentErrors = this.databaseErrors.filter(
      error => error.timestamp.getTime() >= cutoffTime
    );
    
    // Filter bottlenecks by time range
    const recentBottlenecks = this.bottlenecks.filter(
      bottleneck => bottleneck.timestamp.getTime() >= cutoffTime
    );
    
    // Calculate summary statistics
    const completedMetrics = recentMetrics.filter(m => m.duration !== undefined);
    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageDuration = completedMetrics.length > 0 ? totalDuration / completedMetrics.length : 0;
    const slowestOperation = completedMetrics.reduce(
      (slowest, current) => 
        !slowest || (current.duration || 0) > (slowest.duration || 0) ? current : slowest,
      null as PerformanceMetric | null
    );
    
    const errorRate = recentMetrics.length > 0 ? recentErrors.length / recentMetrics.length : 0;
    const criticalBottlenecks = recentBottlenecks.filter(b => b.severity === 'critical').length;
    
    return {
      metrics: recentMetrics,
      databaseErrors: recentErrors,
      bottlenecks: recentBottlenecks,
      summary: {
        totalMeasurements: recentMetrics.length,
        averageDuration,
        slowestOperation,
        errorRate,
        criticalBottlenecks,
      },
    };
  }

  /**
   * Export performance data for external analysis
   */
  public exportPerformanceData(): {
    timestamp: Date;
    metrics: PerformanceMetric[];
    databaseErrors: DatabaseError[];
    bottlenecks: PerformanceBottleneck[];
    debugContexts: DebugContext[];
    systemInfo: {
      userAgent: string;
      url: string;
      memoryUsage?: any;
      connectionInfo?: any;
    };
  } {
    return {
      timestamp: new Date(),
      metrics: Array.from(this.metrics.values()),
      databaseErrors: [...this.databaseErrors],
      bottlenecks: [...this.bottlenecks],
      debugContexts: [...this.debugContexts],
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        } : undefined,
        connectionInfo: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        } : undefined,
      },
    };
  }

  /**
   * Clear all performance data
   */
  public clearPerformanceData(): void {
    this.metrics.clear();
    this.databaseErrors.length = 0;
    this.bottlenecks.length = 0;
    this.debugContexts.length = 0;
    
    this.logPerformanceEvent('PERFORMANCE_DATA_CLEARED');
  }

  // Private helper methods

  private checkForBottlenecks(metric: PerformanceMetric): void {
    if (!metric.duration) return;
    
    // Check for slow operations by category
    let threshold: number = PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS;
    let recommendations: string[] = [];
    
    switch (metric.category) {
      case 'auth':
        threshold = 5000; // AUTH_TIMEOUT_MS
        recommendations = [
          'Check network connectivity',
          'Verify authentication server status',
          'Consider implementing authentication caching',
          'Review session management logic'
        ];
        break;
      case 'database':
        threshold = 2000; // SLOW_QUERY_MS
        recommendations = [
          'Optimize database queries',
          'Add appropriate indexes',
          'Check for table locks',
          'Consider query result caching'
        ];
        break;
      case 'network':
        threshold = 1000; // HIGH_LATENCY_MS
        recommendations = [
          'Check network connection quality',
          'Consider request batching',
          'Implement request caching',
          'Use CDN for static resources'
        ];
        break;
      case 'ui':
        threshold = 100; // UI_RENDER_MS
        recommendations = [
          'Optimize component rendering',
          'Use React.memo for expensive components',
          'Implement virtual scrolling for large lists',
          'Reduce unnecessary re-renders'
        ];
        break;
    }
    
    if (metric.duration > threshold) {
      const severity: PerformanceBottleneck['severity'] = 
        metric.duration > threshold * 3 ? 'critical' :
        metric.duration > threshold * 2 ? 'high' :
        metric.duration > threshold * 1.5 ? 'medium' : 'low';
      
      this.reportBottleneck({
        type: metric.category === 'network' ? 'high_latency' : 'slow_query',
        severity,
        description: `Slow ${metric.category} operation: ${metric.name}`,
        metrics: { duration: metric.duration },
        affectedOperations: [metric.name],
        recommendations,
      });
    }
  }

  private initializePerformanceObserver(): void {
    // Initialize Performance Observer if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.logPerformanceEvent('NAVIGATION_TIMING', {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
                totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error: any) {
        this.logPerformanceEvent('PERFORMANCE_OBSERVER_ERROR', { error: error.message });
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, this.CLEANUP_INTERVAL_MS);
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Clean up old metrics
    const metricsToDelete: string[] = [];
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.absoluteStartTime < cutoffTime) {
        metricsToDelete.push(id);
      }
    }
    metricsToDelete.forEach(id => this.metrics.delete(id));
    
    // Clean up old database errors
    this.databaseErrors = this.databaseErrors.filter(
      error => error.timestamp.getTime() >= cutoffTime
    );
    
    // Clean up old bottlenecks
    this.bottlenecks = this.bottlenecks.filter(
      bottleneck => bottleneck.timestamp.getTime() >= cutoffTime
    );
    
    // Clean up old debug contexts
    this.debugContexts = this.debugContexts.filter(
      context => context.timestamp.getTime() >= cutoffTime
    );
    
    this.logPerformanceEvent('OLD_DATA_CLEANED', {
      metricsDeleted: metricsToDelete.length,
      errorsRemaining: this.databaseErrors.length,
      bottlenecksRemaining: this.bottlenecks.length,
      contextsRemaining: this.debugContexts.length
    });
  }

  private getRecentMetrics(count: number): PerformanceMetric[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, count);
  }

  private getRecentDatabaseErrors(count: number): DatabaseError[] {
    return this.databaseErrors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret='***'");
  }

  private sanitizeAuthState(authState: any): any {
    if (!authState) return null;
    
    // Remove sensitive information from auth state
    const sanitized = { ...authState };
    if (sanitized.user) {
      sanitized.user = {
        _id: sanitized.user._id,
        email: sanitized.user.email ? '***@***.***' : null,
        role: sanitized.user.role,
      };
    }
    delete sanitized.accessToken;
    delete sanitized.refreshToken;
    
    return sanitized;
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logPerformanceEvent(event: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      event,
      data,
    };
    
    console.log(`[PERFORMANCE] ${event}:`, logData);
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToLoggingService(logData);
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clearPerformanceData();
    this.logPerformanceEvent('PERFORMANCE_MONITOR_DESTROYED');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions for easier use
export const startMeasurement = (
  name: string, 
  category?: PerformanceMetric['category'],
  metadata?: Record<string, any>,
  tags?: string[]
) => performanceMonitor.startMeasurement(name, category, metadata, tags);

export const endMeasurement = (id: string, additionalMetadata?: Record<string, any>) => 
  performanceMonitor.endMeasurement(id, additionalMetadata);

export const measureFunction = <T>(
  name: string,
  fn: () => Promise<T> | T,
  category?: PerformanceMetric['category'],
  metadata?: Record<string, any>
) => performanceMonitor.measureFunction(name, fn, category, metadata);

export const logDatabaseError = (
  query: string,
  error: any,
  context?: Parameters<typeof performanceMonitor.logDatabaseError>[2]
) => performanceMonitor.logDatabaseError(query, error, context);

export const captureDebugContext = (additionalContext?: Parameters<typeof performanceMonitor.captureDebugContext>[0]) =>
  performanceMonitor.captureDebugContext(additionalContext);

export const reportBottleneck = (bottleneck: Parameters<typeof performanceMonitor.reportBottleneck>[0]) =>
  performanceMonitor.reportBottleneck(bottleneck);

export const getPerformanceSummary = (timeRangeMs?: number) =>
  performanceMonitor.getPerformanceSummary(timeRangeMs);

export const exportPerformanceData = () => performanceMonitor.exportPerformanceData();

export const clearPerformanceData = () => performanceMonitor.clearPerformanceData();

// Export database query statistics from the database wrapper
export { getQueryStats } from './databaseQueryWrapper';