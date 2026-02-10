import * as fs from 'fs';
import * as path from 'path';
import { FlowAnalyzer } from '../analyzers/FlowAnalyzer';
import { BugDetector } from '../analyzers/BugDetector';
import { SecurityScanner } from '../analyzers/SecurityScanner';
import { PerformanceAnalyzer } from '../analyzers/PerformanceAnalyzer';
import { ResponsiveDetector } from '../analyzers/ResponsiveDetector';

export interface AuditReport {
    project_summary: {
        tech_stack: string;
        tested_flows: string[];
        overall_risk_level: string;
    };
    bugs: any[];
    performance_issues: any[];
    security_issues: any[];
    missing_tests: any[];
    qa_recommendations: any[];
}

export class ProjectAuditor {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    public async audit(): Promise<AuditReport> {
        const files = this.getAllFiles(this.projectPath);

        const flowAnalyzer = new FlowAnalyzer(this.projectPath, files);
        const bugDetector = new BugDetector(this.projectPath, files);
        const securityScanner = new SecurityScanner(this.projectPath, files);
        const performanceAnalyzer = new PerformanceAnalyzer(this.projectPath, files);
        const responsiveDetector = new ResponsiveDetector(this.projectPath, files);

        const bugs = await bugDetector.analyze();
        const securityIssues = await securityScanner.analyze();
        const flowResult = await flowAnalyzer.analyze();
        const performanceIssues = await performanceAnalyzer.analyze();
        const responsiveIssues = await responsiveDetector.analyze();

        // Calculate risk level based on severity
        const overallRisk = this.calculateRisk(bugs, securityIssues);

        // Merge flow, responsive, and performance issues into bugs
        const allBugs = [...bugs, ...flowResult.issues, ...responsiveIssues];

        return {
            project_summary: {
                tech_stack: "React (Detected)",
                tested_flows: flowResult.testedFlows,
                overall_risk_level: overallRisk
            },
            bugs: allBugs,
            performance_issues: performanceIssues,
            security_issues: securityIssues,
            missing_tests: [], // Todo: Implement TestCoverageAnalyzer
            qa_recommendations: [
                "Ensure all critical flows have integration tests.",
                "Review security headers and CSP."
            ]
        };
    }

    private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);
        const excludedFolders = ['node_modules', '.git', 'dist', 'build', '.next', '.github', 'cache', '.cache', 'out', '__pycache__', 'venv', '.venv', 'env'];
        const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.css', '.scss', '.less', '.html', '.module.css'];

        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            try {
                if (fs.statSync(fullPath).isDirectory()) {
                    if (!excludedFolders.includes(file)) {
                        arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
                    }
                } else {
                    const lower = file.toLowerCase();
                    if (allowedExtensions.some(ext => lower.endsWith(ext))) {
                        arrayOfFiles.push(fullPath);
                    }
                }
            } catch (e) {
                // Skip files that can't be read
            }
        });

        return arrayOfFiles;
    }

    private calculateRisk(bugs: any[], securityIssues: any[]): string {
        const criticalBugs = bugs.filter(b => b.severity === 'Critical').length;
        const criticalSecurity = securityIssues.filter(s => s.severity === 'Critical').length;

        if (criticalBugs > 0 || criticalSecurity > 0) return 'Critical';
        if (bugs.length > 5 || securityIssues.length > 5) return 'High';
        return 'Medium';
    }
}
