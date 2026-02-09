import * as fs from 'fs';
import * as path from 'path';
import { FlowAnalyzer } from '../analyzers/FlowAnalyzer';
import { BugDetector } from '../analyzers/BugDetector';
import { SecurityScanner } from '../analyzers/SecurityScanner';

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

        const bugs = await bugDetector.analyze();
        const securityIssues = await securityScanner.analyze();
        const flowResult = await flowAnalyzer.analyze();

        // Calculate risk level based on severity
        const overallRisk = this.calculateRisk(bugs, securityIssues);

        // Merge flow issues into bugs for now, or keep them separate if schema allowed (schema is strict, better put in bugs)
        const allBugs = [...bugs, ...flowResult.issues];

        return {
            project_summary: {
                tech_stack: "React (Detected)",
                tested_flows: flowResult.testedFlows,
                overall_risk_level: overallRisk
            },
            bugs: allBugs,
            performance_issues: [], // Todo: Implement PerformanceAnalyzer
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

        files.forEach((file) => {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
                    arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
                }
            } else {
                if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                    arrayOfFiles.push(path.join(dirPath, "/", file));
                }
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
