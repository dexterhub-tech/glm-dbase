import { executeDataIntegrityTests, DataIntegrityReport } from './dataIntegrityTests';
import { executeAuthenticationTests, AuthTestReport } from './authenticationTests';
import { runMemberManagementTests, MemberTestReport } from './memberManagementTests';

export interface ComprehensiveTestReport {
  timestamp: string;
  overallPassed: boolean;
  totalTestSuites: number;
  passedTestSuites: number;
  failedTestSuites: number;
  totalIndividualTests: number;
  passedIndividualTests: number;
  failedIndividualTests: number;
  testSuites: {
    dataIntegrity: DataIntegrityReport;
    authentication: AuthTestReport;
    memberManagement: MemberTestReport;
  };
  summary: {
    criticalIssues: string[];
    warnings: string[];
    recommendations: string[];
  };
}

/**
 * Execute all comprehensive validation tests for the database consolidation
 */
export const executeComprehensiveValidationTests = async (): Promise<ComprehensiveTestReport> => {
  console.log("=== STARTING COMPREHENSIVE DATABASE CONSOLIDATION VALIDATION ===");
  console.log("This will test data integrity, authentication flows, and member management functionality");
  
  const startTime = new Date();
  
  // Execute all test suites
  console.log("\n1. Executing Data Integrity Tests...");
  const dataIntegrityReport = await executeDataIntegrityTests();
  
  console.log("\n2. Executing Authentication and User Management Tests...");
  const authenticationReport = await executeAuthenticationTests();
  
  console.log("\n3. Executing Member Management Functionality Tests...");
  const memberManagementReport = await runMemberManagementTests();
  
  // Calculate overall statistics
  const testSuites = [dataIntegrityReport, authenticationReport, memberManagementReport];
  const passedTestSuites = testSuites.filter(suite => suite.overallPassed).length;
  const failedTestSuites = testSuites.length - passedTestSuites;
  
  const totalIndividualTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const passedIndividualTests = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
  const failedIndividualTests = totalIndividualTests - passedIndividualTests;
  
  const overallPassed = failedTestSuites === 0 && failedIndividualTests === 0;
  
  // Generate summary with critical issues, warnings, and recommendations
  const summary = generateTestSummary(dataIntegrityReport, authenticationReport, memberManagementReport);
  
  const comprehensiveReport: ComprehensiveTestReport = {
    timestamp: startTime.toISOString(),
    overallPassed,
    totalTestSuites: testSuites.length,
    passedTestSuites,
    failedTestSuites,
    totalIndividualTests,
    passedIndividualTests,
    failedIndividualTests,
    testSuites: {
      dataIntegrity: dataIntegrityReport,
      authentication: authenticationReport,
      memberManagement: memberManagementReport
    },
    summary
  };
  
  // Log comprehensive results
  console.log("\n=== COMPREHENSIVE VALIDATION RESULTS ===");
  console.log(`Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test Suites: ${passedTestSuites}/${testSuites.length} passed`);
  console.log(`Individual Tests: ${passedIndividualTests}/${totalIndividualTests} passed`);
  
  if (summary.criticalIssues.length > 0) {
    console.log(`\n🚨 Critical Issues (${summary.criticalIssues.length}):`);
    summary.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (summary.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${summary.warnings.length}):`);
    summary.warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
  
  if (summary.recommendations.length > 0) {
    console.log(`\n💡 Recommendations (${summary.recommendations.length}):`);
    summary.recommendations.forEach((recommendation, index) => {
      console.log(`  ${index + 1}. ${recommendation}`);
    });
  }
  
  console.log("\n=== COMPREHENSIVE VALIDATION COMPLETE ===");
  
  return comprehensiveReport;
};

/**
 * Generate summary with critical issues, warnings, and recommendations
 */
function generateTestSummary(
  dataIntegrityReport: DataIntegrityReport,
  authenticationReport: AuthTestReport,
  memberManagementReport: MemberTestReport
) {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze data integrity results
  if (!dataIntegrityReport.overallPassed) {
    const failedTests = dataIntegrityReport.tests.filter(test => !test.passed);
    failedTests.forEach(test => {
      criticalIssues.push(`Data Integrity: ${test.message}`);
    });
  }
  
  // Check for orphaned data
  if (dataIntegrityReport.summary.orphanedProfiles > 0) {
    warnings.push(`Found ${dataIntegrityReport.summary.orphanedProfiles} profiles without corresponding members`);
    recommendations.push("Run profile-to-member sync to create missing member records");
  }
  
  if (dataIntegrityReport.summary.orphanedMembers > 0) {
    warnings.push(`Found ${dataIntegrityReport.summary.orphanedMembers} members without corresponding profiles`);
    recommendations.push("Review orphaned members and ensure they have proper authentication setup");
  }
  
  if (dataIntegrityReport.summary.duplicateEmails > 0) {
    criticalIssues.push(`Found ${dataIntegrityReport.summary.duplicateEmails} duplicate email addresses`);
    recommendations.push("Resolve duplicate emails to maintain data integrity");
  }
  
  // Analyze authentication results
  if (!authenticationReport.overallPassed) {
    const failedTests = authenticationReport.tests.filter(test => !test.passed);
    failedTests.forEach(test => {
      if (test.testName.includes("Registration Flow")) {
        criticalIssues.push(`Authentication: ${test.message}`);
      } else {
        warnings.push(`Authentication: ${test.message}`);
      }
    });
  }
  
  // Analyze member management results
  if (!memberManagementReport.overallPassed) {
    const failedTests = memberManagementReport.tests.filter(test => !test.passed);
    failedTests.forEach(test => {
      if (test.testName.includes("CRUD Operations")) {
        criticalIssues.push(`Member Management: ${test.message}`);
      } else {
        warnings.push(`Member Management: ${test.message}`);
      }
    });
  }
  
  // General recommendations based on test results
  if (dataIntegrityReport.summary.profilesCount > 0 && dataIntegrityReport.summary.membersCount > 0) {
    recommendations.push("Database consolidation appears to be working - both tables contain data");
  }
  
  if (authenticationReport.overallPassed && memberManagementReport.overallPassed) {
    recommendations.push("Core functionality is working correctly - system is ready for production use");
  }
  
  // Add specific recommendations based on test details
  const authTest = authenticationReport.tests.find(test => test.testName.includes("Admin/Superuser Access"));
  if (authTest?.details?.isSuperuser) {
    recommendations.push("Superuser access confirmed - admin functions should be available");
  }
  
  return {
    criticalIssues,
    warnings,
    recommendations
  };
}

/**
 * Generate a detailed HTML report of all test results
 */
export const generateHTMLReport = (report: ComprehensiveTestReport): string => {
  const timestamp = new Date(report.timestamp).toLocaleString();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Consolidation Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; font-weight: bold; }
        .status.passed { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.failed { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .test-suite { margin: 20px 0; border: 1px solid #dee2e6; border-radius: 4px; }
        .test-suite-header { background: #e9ecef; padding: 15px; font-weight: bold; }
        .test-result { padding: 10px 15px; border-bottom: 1px solid #dee2e6; }
        .test-result:last-child { border-bottom: none; }
        .test-passed { color: #28a745; }
        .test-failed { color: #dc3545; }
        .details { background: #f8f9fa; padding: 10px; margin-top: 10px; border-radius: 4px; font-size: 0.9em; }
        .issues { margin: 20px 0; }
        .issue-list { list-style-type: none; padding: 0; }
        .issue-list li { padding: 8px; margin: 5px 0; border-radius: 4px; }
        .critical { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
        .recommendation { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Database Consolidation Validation Report</h1>
            <p>Generated on: ${timestamp}</p>
            <div class="status ${report.overallPassed ? 'passed' : 'failed'}">
                Overall Status: ${report.overallPassed ? '✅ PASSED' : '❌ FAILED'}
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Test Suites</h3>
                <p>${report.passedTestSuites}/${report.totalTestSuites} Passed</p>
            </div>
            <div class="summary-card">
                <h3>Individual Tests</h3>
                <p>${report.passedIndividualTests}/${report.totalIndividualTests} Passed</p>
            </div>
            <div class="summary-card">
                <h3>Data Records</h3>
                <p>Profiles: ${report.testSuites.dataIntegrity.summary.profilesCount}</p>
                <p>Members: ${report.testSuites.dataIntegrity.summary.membersCount}</p>
            </div>
        </div>
        
        ${generateTestSuiteHTML('Data Integrity Tests', report.testSuites.dataIntegrity)}
        ${generateTestSuiteHTML('Authentication Tests', report.testSuites.authentication)}
        ${generateTestSuiteHTML('Member Management Tests', report.testSuites.memberManagement)}
        
        <div class="issues">
            ${report.summary.criticalIssues.length > 0 ? `
                <h3>🚨 Critical Issues</h3>
                <ul class="issue-list">
                    ${report.summary.criticalIssues.map(issue => `<li class="critical">${issue}</li>`).join('')}
                </ul>
            ` : ''}
            
            ${report.summary.warnings.length > 0 ? `
                <h3>⚠️ Warnings</h3>
                <ul class="issue-list">
                    ${report.summary.warnings.map(warning => `<li class="warning">${warning}</li>`).join('')}
                </ul>
            ` : ''}
            
            ${report.summary.recommendations.length > 0 ? `
                <h3>💡 Recommendations</h3>
                <ul class="issue-list">
                    ${report.summary.recommendations.map(rec => `<li class="recommendation">${rec}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
};

function generateTestSuiteHTML(suiteName: string, suite: any): string {
  return `
    <div class="test-suite">
        <div class="test-suite-header">
            ${suiteName} - ${suite.overallPassed ? '✅ PASSED' : '❌ FAILED'} 
            (${suite.passedTests}/${suite.totalTests})
        </div>
        ${suite.tests.map((test: any) => `
            <div class="test-result">
                <span class="${test.passed ? 'test-passed' : 'test-failed'}">
                    ${test.passed ? '✅' : '❌'} ${test.testName}
                </span>
                <p>${test.message}</p>
                ${test.details ? `
                    <div class="details">
                        <strong>Details:</strong> ${JSON.stringify(test.details, null, 2)}
                    </div>
                ` : ''}
                ${test.error ? `
                    <div class="details">
                        <strong>Error:</strong> ${test.error}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

/**
 * Save the comprehensive test report to a file
 */
export const saveTestReportToFile = async (report: ComprehensiveTestReport): Promise<string> => {
  const timestamp = new Date(report.timestamp).toISOString().replace(/[:.]/g, '-');
  const filename = `database-consolidation-validation-report-${timestamp}.json`;
  
  try {
    // In a real implementation, you would save this to a file
    // For now, we'll just return the filename and log the report
    console.log(`Test report would be saved as: ${filename}`);
    console.log("Report data:", JSON.stringify(report, null, 2));
    
    return filename;
  } catch (error) {
    console.error("Error saving test report:", error);
    throw error;
  }
};