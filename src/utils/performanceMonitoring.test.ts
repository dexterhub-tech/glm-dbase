/**
 * Performance Monitoring Tests
 * 
 * Tests for the performance monitoring and logging system
 */

import { describe, it, expect, afterAll } from 'vitest';
import { 
  performanceMonitor, 
  startMeasurement, 
  endMeasurement, 
  measureFunction,
  logDatabaseError,
  reportBottleneck,
  getPerformanceSummary
} from './performanceMonitoring';

describe('Performance Monitoring', () => {
  afterAll(() => {
    // Clean up after tests
    performanceMonitor.destroy();
  });

  describe('Basic Measurement', () => {
    it('should start and end measurements correctly', () => {
      const id = startMeasurement('test_operation', 'general', { testData: 'value' });
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait for at least 10ms
      }

      const result = endMeasurement(id, { success: true });
      expect(result).toBeDefined();
      expect(result?.duration).toBeGreaterThan(0);
      expect(result?.name).toBe('test_operation');
      expect(result?.category).toBe('general');
    });

    it('should handle non-existent measurement IDs gracefully', () => {
      const result = endMeasurement('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Function Measurement', () => {
    it('should measure synchronous functions', async () => {
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = await measureFunction('sync_test', testFunction, 'general');
      expect(result).toBe(499500); // Sum of 0 to 999
    });

    it('should measure asynchronous functions', async () => {
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async_result';
      };

      const result = await measureFunction('async_test', asyncFunction, 'general');
      expect(result).toBe('async_result');
    });

    it('should handle function errors correctly', async () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      await expect(measureFunction('error_test', errorFunction, 'general'))
        .rejects.toThrow('Test error');
    });
  });

  describe('Database Error Logging', () => {
    it('should log database errors with context', () => {
      const mockError = {
        message: 'Connection failed',
        code: '08000',
        details: 'Network timeout'
      };

      logDatabaseError(
        'SELECT * FROM users WHERE id = $1',
        mockError,
        {
          table: 'users',
          operation: 'select',
          duration: 5000,
          retryCount: 2
        }
      );

      const summary = getPerformanceSummary();
      expect(summary.databaseErrors.length).toBe(1);
      expect(summary.databaseErrors[0].error.message).toBe('Connection failed');
      expect(summary.databaseErrors[0].table).toBe('users');
      expect(summary.databaseErrors[0].operation).toBe('select');
    });
  });

  describe('Bottleneck Reporting', () => {
    it('should report performance bottlenecks', () => {
      // Clear any existing data first
      performanceMonitor.clearPerformanceData();
      
      reportBottleneck({
        type: 'slow_query',
        severity: 'high',
        description: 'Slow database query detected',
        metrics: { duration: 3000 },
        affectedOperations: ['select_users'],
        recommendations: ['Add database index', 'Optimize query']
      });

      const summary = getPerformanceSummary();
      expect(summary.bottlenecks.length).toBeGreaterThanOrEqual(1);
      expect(summary.bottlenecks[0].type).toBe('slow_query');
      expect(summary.bottlenecks[0].severity).toBe('high');
      expect(summary.bottlenecks[0].recommendations).toContain('Add database index');
    });
  });

  describe('Performance Summary', () => {
    it('should generate accurate performance summaries', () => {
      // Clear any existing data first
      performanceMonitor.clearPerformanceData();
      
      // Create some test measurements
      const id1 = startMeasurement('fast_op', 'general');
      endMeasurement(id1, { success: true });

      const id2 = startMeasurement('slow_op', 'database');
      // Simulate slow operation
      const start = performance.now();
      while (performance.now() - start < 20) {
        // Wait for at least 20ms
      }
      endMeasurement(id2, { success: true });

      const summary = getPerformanceSummary();
      expect(summary.summary.totalMeasurements).toBeGreaterThanOrEqual(2);
      expect(summary.summary.averageDuration).toBeGreaterThan(0);
      expect(summary.metrics.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by time range correctly', () => {
      // Clear any existing data first
      performanceMonitor.clearPerformanceData();
      
      // Create a measurement
      const id = startMeasurement('test_op', 'general');
      endMeasurement(id);

      // Wait a moment to ensure the measurement is recorded
      const start = performance.now();
      while (performance.now() - start < 5) {
        // Wait for at least 5ms
      }

      // Get summary for a longer time range (should include the measurement)
      const longSummary = getPerformanceSummary(60000); // 1 minute
      expect(longSummary.metrics.length).toBeGreaterThanOrEqual(1);

      // Get summary for a very short time range (should be empty or have fewer)
      const shortSummary = getPerformanceSummary(1); // 1ms
      expect(shortSummary.metrics.length).toBeLessThanOrEqual(longSummary.metrics.length);
    });
  });

  describe('Data Export and Cleanup', () => {
    it('should export performance data correctly', () => {
      // Create some test data
      const id = startMeasurement('export_test', 'general');
      endMeasurement(id);

      const exportData = performanceMonitor.exportPerformanceData();
      expect(exportData.timestamp).toBeDefined();
      expect(exportData.metrics.length).toBeGreaterThanOrEqual(1);
      expect(exportData.systemInfo.userAgent).toBeDefined();
    });

    it('should clear performance data', () => {
      // Clear any existing data first
      performanceMonitor.clearPerformanceData();
      
      // Create some test data
      const id = startMeasurement('clear_test', 'general');
      endMeasurement(id);

      let summary = getPerformanceSummary();
      expect(summary.metrics.length).toBeGreaterThanOrEqual(1);

      // Clear data
      performanceMonitor.clearPerformanceData();

      summary = getPerformanceSummary();
      expect(summary.metrics.length).toBe(0);
    });
  });
});