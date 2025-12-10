/**
 * Performance Monitoring Panel Component
 * 
 * Displays real-time performance metrics, database query statistics,
 * bottleneck identification, and debugging information for administrators.
 * 
 * Requirements: 3.3, 3.4
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getPerformanceSummary, 
  exportPerformanceData, 
  clearPerformanceData,
  getQueryStats
} from '@/utils/performanceMonitoring';
import { 
  getLogs, 
  getLogSummary, 
  exportLogs, 
  clearLogs 
} from '@/utils/comprehensiveLogging';
import type { PerformanceBottleneck, PerformanceMetric } from '@/utils/performanceMonitoring';
import type { LogEntry } from '@/utils/comprehensiveLogging';

interface PerformanceMonitoringPanelProps {
  className?: string;
}

export const PerformanceMonitoringPanel: React.FC<PerformanceMonitoringPanelProps> = ({ 
  className = '' 
}) => {
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);
  const [logSummary, setLogSummary] = useState<any>(null);
  const [queryStats, setQueryStats] = useState<any>(null);
  const [recentBottlenecks, setRecentBottlenecks] = useState<PerformanceBottleneck[]>([]);
  const [recentErrors, setRecentErrors] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Get performance summary for last 5 minutes
      const perfSummary = getPerformanceSummary(5 * 60 * 1000);
      setPerformanceSummary(perfSummary);
      setRecentBottlenecks(perfSummary.bottlenecks.slice(-10));

      // Get log summary
      const logs = getLogSummary(5 * 60 * 1000);
      setLogSummary(logs);

      // Get recent error logs
      const errorLogs = getLogs({
        level: 'error',
        limit: 10
      });
      setRecentErrors(errorLogs);

      // Get database query statistics
      const dbStats = getQueryStats(5 * 60 * 1000);
      setQueryStats(dbStats);

    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh]);

  // Export performance data
  const handleExportPerformance = useCallback(() => {
    try {
      const data = exportPerformanceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export performance data:', error);
    }
  }, []);

  // Export logs
  const handleExportLogs = useCallback((format: 'json' | 'csv' = 'json') => {
    try {
      const data = exportLogs(format);
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  }, []);

  // Clear data
  const handleClearData = useCallback((type: 'performance' | 'logs' | 'both') => {
    if (window.confirm(`Are you sure you want to clear ${type} data? This action cannot be undone.`)) {
      try {
        if (type === 'performance' || type === 'both') {
          clearPerformanceData();
        }
        if (type === 'logs' || type === 'both') {
          clearLogs();
        }
        refreshData();
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  }, [refreshData]);

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and system diagnostics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {recentBottlenecks.filter(b => b.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            {recentBottlenecks.filter(b => b.severity === 'critical').length} critical performance 
            issues detected in the last 5 minutes. Check the bottlenecks tab for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceSummary ? formatDuration(performanceSummary.summary.averageDuration) : '--'}
                </div>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceSummary?.summary.totalMeasurements || 0}
                </div>
                <p className="text-xs text-muted-foreground">Completed operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {logSummary ? `${(logSummary.errorRate * 100).toFixed(1)}%` : '--'}
                </div>
                <p className="text-xs text-muted-foreground">Error percentage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceSummary?.summary.criticalBottlenecks || 0}
                </div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bottlenecks</CardTitle>
                <CardDescription>Performance issues in the last 5 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentBottlenecks.slice(0, 5).map((bottleneck) => (
                    <div key={bottleneck.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{bottleneck.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {bottleneck.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant={getSeverityColor(bottleneck.severity) as "default" | "secondary" | "destructive" | "outline"}>
                        {bottleneck.severity}
                      </Badge>
                    </div>
                  ))}
                  {recentBottlenecks.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bottlenecks detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Error logs from the last 5 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentErrors.slice(0, 5).map((error) => (
                    <div key={error.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">{error.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {error.category} • {error.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                  {recentErrors.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent errors</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Performance Metrics</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPerformance}>
                Export Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleClearData('performance')}
              >
                Clear Data
              </Button>
            </div>
          </div>

          {performanceSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Slowest Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performanceSummary.metrics
                      .filter((m: PerformanceMetric) => m.duration)
                      .sort((a: PerformanceMetric, b: PerformanceMetric) => (b.duration || 0) - (a.duration || 0))
                      .slice(0, 10)
                      .map((metric: PerformanceMetric) => (
                        <div key={metric.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{metric.name}</p>
                            <p className="text-xs text-muted-foreground">{metric.category}</p>
                          </div>
                          <Badge variant="outline">
                            {formatDuration(metric.duration || 0)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      performanceSummary.metrics.reduce((acc: any, metric: PerformanceMetric) => {
                        if (!acc[metric.category]) {
                          acc[metric.category] = { count: 0, totalDuration: 0 };
                        }
                        acc[metric.category].count++;
                        acc[metric.category].totalDuration += metric.duration || 0;
                        return acc;
                      }, {})
                    ).map(([category, stats]: [string, any]) => (
                      <div key={category} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium capitalize">{category}</p>
                          <p className="text-xs text-muted-foreground">{stats.count} operations</p>
                        </div>
                        <Badge variant="outline">
                          {formatDuration(stats.totalDuration / stats.count)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Database Performance</h3>
          </div>

          {queryStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Query Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Queries</p>
                        <p className="text-2xl font-bold">{queryStats.totalQueries}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                        <p className="text-2xl font-bold">{formatDuration(queryStats.averageDuration)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Error Rate</p>
                        <p className="text-2xl font-bold">{(queryStats.errorRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Slow Queries</p>
                        <p className="text-2xl font-bold">{queryStats.slowQueries}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slowest Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {queryStats.topSlowTables.map((table: any) => (
                      <div key={table.table} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">{table.table}</p>
                          <p className="text-xs text-muted-foreground">{table.count} queries</p>
                        </div>
                        <Badge variant="outline">
                          {formatDuration(table.avgDuration)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Bottlenecks Tab */}
        <TabsContent value="bottlenecks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Performance Bottlenecks</h3>
          </div>

          <div className="space-y-4">
            {recentBottlenecks.map((bottleneck) => (
              <Card key={bottleneck.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{bottleneck.description}</CardTitle>
                      <CardDescription>
                        {bottleneck.type} • {bottleneck.timestamp.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getSeverityColor(bottleneck.severity) as "default" | "secondary" | "destructive" | "outline"}>
                      {bottleneck.severity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Affected Operations:</p>
                      <p className="text-sm text-muted-foreground">
                        {bottleneck.affectedOperations.join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Metrics:</p>
                      <div className="flex gap-4">
                        {Object.entries(bottleneck.metrics).map(([key, value]) => (
                          <span key={key} className="text-sm text-muted-foreground">
                            {key}: {typeof value === 'number' ? formatDuration(value) : value}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Recommendations:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {bottleneck.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {recentBottlenecks.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No performance bottlenecks detected</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">System Logs</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportLogs('json')}>
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportLogs('csv')}>
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleClearData('logs')}
              >
                Clear Logs
              </Button>
            </div>
          </div>

          {logSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Log Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Logs:</span>
                      <span className="text-sm font-medium">{logSummary.totalLogs}</span>
                    </div>
                    {Object.entries(logSummary.logsByLevel).map(([level, count]) => (
                      <div key={level} className="flex justify-between">
                        <span className="text-sm capitalize">{level}:</span>
                        <span className="text-sm font-medium">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {logSummary.topEvents.map((event: any) => (
                      <div key={event.event} className="flex justify-between items-center">
                        <span className="text-sm">{event.event}</span>
                        <Badge variant="outline">{event.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};