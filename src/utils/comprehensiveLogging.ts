/**
 * Comprehensive Logging Utility
 * 
 * Provides structured logging for authentication events, performance metrics,
 * database operations, and debugging information with context capture.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { captureDebugContext, performanceMonitor } from './performanceMonitoring';
import { getNetworkState } from './networkConnectivity';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: 'auth' | 'database' | 'performance' | 'network' | 'ui' | 'system' | 'security';
  event: string;
  message: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    name?: string;
  };
  context?: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    networkState?: any;
    performanceMetrics?: any[];
  };
  tags?: string[];
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsoleOutput: boolean;
  enablePerformanceIntegration: boolean;
  enableContextCapture: boolean;
  maxStoredLogs: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsoleOutput: true,
  enablePerformanceIntegration: true,
  enableContextCapture: true,
  maxStoredLogs: 1000,
  enableRemoteLogging: false,
};

// Log level hierarchy for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

class ComprehensiveLogger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  /**
   * Log an authentication event
   */
  public logAuthEvent(
    event: string,
    data?: Record<string, any>,
    error?: any,
    userId?: string
  ): void {
    this.log('info', 'auth', event, `Authentication event: ${event}`, {
      data,
      error: error ? this.serializeError(error) : undefined,
      context: {
        userId,
        sessionId: this.sessionId,
      }
    });
  }

  /**
   * Log a database operation
   */
  public logDatabaseOperation(
    operation: string,
    table: string,
    data?: Record<string, any>,
    error?: any,
    duration?: number
  ): void {
    const level: LogLevel = error ? 'error' : duration && duration > 2000 ? 'warn' : 'info';
    
    this.log(level, 'database', `db_${operation}_${table}`, 
      `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, {
      data: {
        operation,
        table,
        duration,
        ...data
      },
      error: error ? this.serializeError(error) : undefined,
    });
  }

  /**
   * Log a performance metric
   */
  public logPerformanceMetric(
    metricName: string,
    duration: number,
    category: string,
    data?: Record<string, any>
  ): void {
    const level: LogLevel = duration > 5000 ? 'warn' : 'info';
    
    this.log(level, 'performance', `perf_${category}_${metricName}`,
      `Performance: ${metricName} completed in ${duration}ms`, {
      data: {
        metricName,
        duration,
        category,
        ...data
      }
    });
  }

  /**
   * Log a network event
   */
  public logNetworkEvent(
    event: string,
    data?: Record<string, any>,
    error?: any
  ): void {
    const level: LogLevel = error ? 'error' : event.includes('failed') ? 'warn' : 'info';
    
    this.log(level, 'network', event, `Network event: ${event}`, {
      data: {
        networkState: getNetworkState(),
        ...data
      },
      error: error ? this.serializeError(error) : undefined,
    });
  }

  /**
   * Log a security event
   */
  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    data?: Record<string, any>,
    userId?: string
  ): void {
    const level: LogLevel = severity === 'critical' ? 'critical' : 
                           severity === 'high' ? 'error' :
                           severity === 'medium' ? 'warn' : 'info';
    
    this.log(level, 'security', event, `Security event: ${event} (${severity})`, {
      data: {
        severity,
        ...data
      },
      context: {
        userId,
        sessionId: this.sessionId,
      },
      tags: ['security', severity]
    });
  }

  /**
   * Log a system event
   */
  public logSystemEvent(
    event: string,
    data?: Record<string, any>,
    error?: any
  ): void {
    const level: LogLevel = error ? 'error' : 'info';
    
    this.log(level, 'system', event, `System event: ${event}`, {
      data,
      error: error ? this.serializeError(error) : undefined,
    });
  }

  /**
   * Log a UI event
   */
  public logUIEvent(
    event: string,
    component: string,
    data?: Record<string, any>,
    error?: any
  ): void {
    const level: LogLevel = error ? 'error' : 'debug';
    
    this.log(level, 'ui', `ui_${component}_${event}`, 
      `UI event: ${event} in ${component}`, {
      data: {
        component,
        ...data
      },
      error: error ? this.serializeError(error) : undefined,
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogEntry['category'],
    event: string,
    message: string,
    options: {
      data?: Record<string, any>;
      error?: LogEntry['error'];
      context?: Partial<LogEntry['context']>;
      tags?: string[];
    } = {}
  ): void {
    // Check if log level meets minimum threshold
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      category,
      event,
      message,
      data: options.data,
      error: options.error,
      context: {
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...options.context,
        ...(this.config.enableContextCapture ? this.captureAdditionalContext() : {})
      },
      tags: options.tags,
    };

    // Store log entry
    this.logs.push(logEntry);
    
    // Maintain log size limit
    if (this.logs.length > this.config.maxStoredLogs) {
      this.logs = this.logs.slice(-this.config.maxStoredLogs);
    }

    // Console output
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // Performance integration
    if (this.config.enablePerformanceIntegration && category === 'performance') {
      // Performance metrics are already handled by the performance monitor
    }

    // Buffer for remote logging
    if (this.config.enableRemoteLogging) {
      this.bufferForRemoteLogging(logEntry);
    }

    // Trigger immediate flush for critical logs
    if (level === 'critical') {
      this.flushRemoteLogs();
    }
  }

  /**
   * Get logs with optional filtering
   */
  public getLogs(filters?: {
    level?: LogLevel;
    category?: LogEntry['category'];
    event?: string;
    timeRange?: { start: Date; end: Date };
    userId?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        const minLevelValue = LOG_LEVELS[filters.level];
        filteredLogs = filteredLogs.filter(log => LOG_LEVELS[log.level] >= minLevelValue);
      }

      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }

      if (filters.event) {
        filteredLogs = filteredLogs.filter(log => 
          log.event.toLowerCase().includes(filters.event!.toLowerCase())
        );
      }

      if (filters.timeRange) {
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= filters.timeRange!.start && 
          log.timestamp <= filters.timeRange!.end
        );
      }

      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => 
          log.context?.userId === filters.userId
        );
      }

      if (filters.limit) {
        filteredLogs = filteredLogs.slice(-filters.limit);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get log summary statistics
   */
  public getLogSummary(timeRangeMs: number = 5 * 60 * 1000): {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByCategory: Record<string, number>;
    errorRate: number;
    topEvents: Array<{ event: string; count: number }>;
    recentCriticalLogs: LogEntry[];
  } {
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    const recentLogs = this.logs.filter(log => log.timestamp >= cutoffTime);

    const logsByLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    };

    const logsByCategory: Record<string, number> = {};
    const eventCounts: Record<string, number> = {};

    recentLogs.forEach(log => {
      logsByLevel[log.level]++;
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
      eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
    });

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }));

    const errorLogs = recentLogs.filter(log => 
      log.level === 'error' || log.level === 'critical'
    );
    const errorRate = recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0;

    const recentCriticalLogs = recentLogs
      .filter(log => log.level === 'critical')
      .slice(-5);

    return {
      totalLogs: recentLogs.length,
      logsByLevel,
      logsByCategory,
      errorRate,
      topEvents,
      recentCriticalLogs,
    };
  }

  /**
   * Export logs for external analysis
   */
  public exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'event', 'message', 'userId', 'error'];
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        log.event,
        log.message,
        log.context?.userId || '',
        log.error?.message || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs.length = 0;
    this.logBuffer.length = 0;
    
    this.log('info', 'system', 'logs_cleared', 'All logs have been cleared');
  }

  /**
   * Update logger configuration
   */
  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.log('info', 'system', 'config_updated', 'Logger configuration updated', {
      data: { newConfig }
    });
  }

  // Private helper methods

  private initializeLogger(): void {
    // Set up periodic remote log flushing
    if (this.config.enableRemoteLogging) {
      this.flushTimer = setInterval(() => {
        this.flushRemoteLogs();
      }, 30000); // Flush every 30 seconds
    }

    // Log initialization
    this.log('info', 'system', 'logger_initialized', 'Comprehensive logger initialized', {
      data: { 
        sessionId: this.sessionId,
        config: this.config 
      }
    });

    // Set up error handlers
    window.addEventListener('error', (event) => {
      this.log('error', 'system', 'uncaught_error', 'Uncaught JavaScript error', {
        error: {
          message: event.error?.message || event.message,
          stack: event.error?.stack,
          code: `${event.filename}:${event.lineno}:${event.colno}`,
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'system', 'unhandled_promise_rejection', 'Unhandled promise rejection', {
        error: {
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        }
      });
    });
  }

  private captureAdditionalContext(): Partial<LogEntry['context']> {
    const context: Partial<LogEntry['context']> = {};

    // Add network state
    try {
      context.networkState = getNetworkState();
    } catch (error) {
      // Ignore network state capture errors
    }

    // Add recent performance metrics
    if (this.config.enablePerformanceIntegration) {
      try {
        const summary = performanceMonitor.getPerformanceSummary(60000); // Last minute
        context.performanceMetrics = summary.metrics.slice(-5); // Last 5 metrics
      } catch (error) {
        // Ignore performance metrics capture errors
      }
    }

    return context;
  }

  private outputToConsole(logEntry: LogEntry): void {
    const { level, category, event, message, data, error } = logEntry;
    const prefix = `[${level.toUpperCase()}] [${category.toUpperCase()}] ${event}:`;
    
    const logData = {
      message,
      ...(data && { data }),
      ...(error && { error }),
      timestamp: logEntry.timestamp.toISOString(),
    };

    switch (level) {
      case 'debug':
        console.debug(prefix, logData);
        break;
      case 'info':
        console.info(prefix, logData);
        break;
      case 'warn':
        console.warn(prefix, logData);
        break;
      case 'error':
      case 'critical':
        console.error(prefix, logData);
        break;
    }
  }

  private bufferForRemoteLogging(logEntry: LogEntry): void {
    this.logBuffer.push(logEntry);
    
    // Flush buffer if it gets too large
    if (this.logBuffer.length >= 100) {
      this.flushRemoteLogs();
    }
  }

  private async flushRemoteLogs(): Promise<void> {
    if (!this.config.enableRemoteLogging || !this.config.remoteEndpoint || this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer.length = 0;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logs: logsToSend,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      // If remote logging fails, put logs back in buffer
      this.logBuffer.unshift(...logsToSend);
      
      // Log the failure locally (but don't try to send it remotely)
      console.error('Failed to send logs to remote endpoint:', error);
    }
  }

  private serializeError(error: any): LogEntry['error'] {
    if (!error) return undefined;

    return {
      message: error.message || String(error),
      stack: error.stack,
      code: error.code,
      name: error.name || error.constructor?.name,
    };
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    this.flushRemoteLogs();

    this.log('info', 'system', 'logger_destroyed', 'Comprehensive logger destroyed');
  }
}

// Create singleton instance
export const logger = new ComprehensiveLogger();

// Export convenience functions
export const logAuthEvent = (event: string, data?: Record<string, any>, error?: any, userId?: string) =>
  logger.logAuthEvent(event, data, error, userId);

export const logDatabaseOperation = (operation: string, table: string, data?: Record<string, any>, error?: any, duration?: number) =>
  logger.logDatabaseOperation(operation, table, data, error, duration);

export const logPerformanceMetric = (metricName: string, duration: number, category: string, data?: Record<string, any>) =>
  logger.logPerformanceMetric(metricName, duration, category, data);

export const logNetworkEvent = (event: string, data?: Record<string, any>, error?: any) =>
  logger.logNetworkEvent(event, data, error);

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: Record<string, any>, userId?: string) =>
  logger.logSecurityEvent(event, severity, data, userId);

export const logSystemEvent = (event: string, data?: Record<string, any>, error?: any) =>
  logger.logSystemEvent(event, data, error);

export const logUIEvent = (event: string, component: string, data?: Record<string, any>, error?: any) =>
  logger.logUIEvent(event, component, data, error);

export const getLogs = (filters?: Parameters<typeof logger.getLogs>[0]) => logger.getLogs(filters);

export const getLogSummary = (timeRangeMs?: number) => logger.getLogSummary(timeRangeMs);

export const exportLogs = (format?: 'json' | 'csv') => logger.exportLogs(format);

export const clearLogs = () => logger.clearLogs();

// Export performance monitoring functions for convenience
export { 
  captureDebugContext, 
  startMeasurement, 
  endMeasurement 
} from './performanceMonitoring';