import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import {
  testSuperadminLogin,
  verifyAdminDashboardAccess,
  performSystemHealthChecks,
  testCompleteAuthFlow,
  verifySuperadminAccount,
  runAllVerificationTests,
  type AuthVerificationResult,
  type SystemHealthCheck,
  type AuthFlowTestResult
} from '@/utils/authVerification';

interface TestResults {
  loginTest?: AuthVerificationResult;
  adminAccess?: AuthVerificationResult;
  systemHealth?: SystemHealthCheck[];
  authFlow?: AuthFlowTestResult[];
  accountVerification?: AuthVerificationResult;
}

export function AuthVerificationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults>({});
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runVerificationTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runAllVerificationTests();
      setResults(testResults);
      setLastRun(new Date());
    } catch (error) {
      console.error('Verification tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runIndividualTest = async (testName: string) => {
    setIsRunning(true);
    try {
      let result;
      switch (testName) {
        case 'login':
          result = await testSuperadminLogin();
          setResults(prev => ({ ...prev, loginTest: result }));
          break;
        case 'adminAccess':
          result = await verifyAdminDashboardAccess();
          setResults(prev => ({ ...prev, adminAccess: result }));
          break;
        case 'systemHealth':
          result = await performSystemHealthChecks();
          setResults(prev => ({ ...prev, systemHealth: result }));
          break;
        case 'authFlow':
          result = await testCompleteAuthFlow();
          setResults(prev => ({ ...prev, authFlow: result }));
          break;
        case 'accountVerification':
          result = await verifySuperadminAccount();
          setResults(prev => ({ ...prev, accountVerification: result }));
          break;
      }
      setLastRun(new Date());
    } catch (error) {
      console.error(`${testName} test failed:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return null;
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === undefined) return <Badge variant="secondary">Not Run</Badge>;
    return success ? (
      <Badge variant="default" className="bg-green-500">Passed</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Authentication Verification System
          </CardTitle>
          <CardDescription>
            Comprehensive testing suite for superadmin authentication and system health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={runVerificationTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run All Tests
            </Button>
            
            {lastRun && (
              <div className="text-sm text-muted-foreground">
                Last run: {lastRun.toLocaleTimeString()}
              </div>
            )}
          </div>

          {Object.keys(results).length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Test results are displayed below. Review any failed tests and take corrective action.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>    
  {/* Individual Test Results */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Login Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.loginTest?.success)}
                Login Test
              </span>
              {getStatusBadge(results.loginTest?.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runIndividualTest('login')}
                disabled={isRunning}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Test Login
              </Button>
              
              {results.loginTest && (
                <div className="text-sm">
                  <p className={results.loginTest.success ? 'text-green-600' : 'text-red-600'}>
                    {results.loginTest.message}
                  </p>
                  {results.loginTest.details && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>User ID: {results.loginTest.details.userId}</p>
                      <p>Email: {results.loginTest.details.email}</p>
                      <p>Email Confirmed: {results.loginTest.details.emailConfirmed ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {results.loginTest.error && (
                    <p className="mt-2 text-xs text-red-500">
                      Error: {results.loginTest.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Access Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.adminAccess?.success)}
                Admin Access Test
              </span>
              {getStatusBadge(results.adminAccess?.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runIndividualTest('adminAccess')}
                disabled={isRunning}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Test Admin Access
              </Button>
              
              {results.adminAccess && (
                <div className="text-sm">
                  <p className={results.adminAccess.success ? 'text-green-600' : 'text-red-600'}>
                    {results.adminAccess.message}
                  </p>
                  {results.adminAccess.details?.roles && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Roles: {results.adminAccess.details.roles.join(', ')}</p>
                      <p>Has Admin Role: {results.adminAccess.details.hasAdminRole ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                  {results.adminAccess.error && (
                    <p className="mt-2 text-xs text-red-500">
                      Error: {results.adminAccess.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Verification Test */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(results.accountVerification?.success)}
                Account Verification
              </span>
              {getStatusBadge(results.accountVerification?.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runIndividualTest('accountVerification')}
                disabled={isRunning}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Verify Account
              </Button>
              
              {results.accountVerification && (
                <div className="text-sm">
                  <p className={results.accountVerification.success ? 'text-green-600' : 'text-red-600'}>
                    {results.accountVerification.message}
                  </p>
                  {results.accountVerification.details && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <p>Profile: {results.accountVerification.details.profile?.exists ? '✓' : '✗'}</p>
                      <p>Member: {results.accountVerification.details.member?.exists ? '✓' : '✗'}</p>
                      <p>Roles: {results.accountVerification.details.roles?.exists ? '✓' : '✗'}</p>
                      <p>Superuser Role: {results.accountVerification.details.roles?.hasSuperuserRole ? '✓' : '✗'}</p>
                    </div>
                  )}
                  {results.accountVerification.error && (
                    <p className="mt-2 text-xs text-red-500">
                      Error: {results.accountVerification.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>      {/* 
System Health Checks */}
      {results.systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              System Health Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runIndividualTest('systemHealth')}
                disabled={isRunning}
                className="mb-4"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Run Health Checks
              </Button>
              
              <div className="space-y-2">
                {results.systemHealth.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {check.status === 'healthy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{check.component}</span>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          check.status === 'healthy' ? 'default' : 
                          check.status === 'warning' ? 'secondary' : 'destructive'
                        }
                        className={
                          check.status === 'healthy' ? 'bg-green-500' : ''
                        }
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {check.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Flow Test */}
      {results.authFlow && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Authentication Flow Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runIndividualTest('authFlow')}
                disabled={isRunning}
                className="mb-4"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Test Auth Flow
              </Button>
              
              <div className="space-y-2">
                {results.authFlow.map((step, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {step.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{step.step}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant={step.success ? 'default' : 'destructive'}>
                        {step.success ? 'PASSED' : 'FAILED'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.message}
                      </p>
                      {step.error && (
                        <p className="text-xs text-red-500 mt-1">
                          {step.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}