import * as fs from 'fs';

export class FlowAnalyzer {
    private files: string[];

    constructor(projectPath: string, files: string[]) {
        this.files = files;
    }

    public async analyze(): Promise<{ testedFlows: string[], issues: any[] }> {
        const issues: any[] = [];
        const uniqueRoutes: Set<string> = new Set();
        const apiCalls: Set<string> = new Set();

        for (const file of this.files) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line) => {
                // React Router
                const routeMatch = line.match(/<Route\s+path=['"]([^'"]+)['"]/);
                if (routeMatch) {
                    uniqueRoutes.add(routeMatch[1]);
                }

                // Fetch / Axios
                const apiMatch = line.match(/(fetch|axios\.get|axios\.post)\s*\(['"]([^'"]+)['"]/);
                if (apiMatch) {
                    apiCalls.add(apiMatch[2]);
                }
            });
        }

        // Generate flow descriptions
        const testedFlows = Array.from(uniqueRoutes).map(route => `User navigates to ${route}`);

        if (uniqueRoutes.size === 0) {
            issues.push({
                id: `FLOW-001`,
                title: 'No Routes Detected',
                file: 'project-root',
                line: 0,
                severity: 'Low',
                category: 'Flow',
                root_cause: 'Missing routing configuration or non-standard router',
                impact: 'Cannot verify user flows',
                reproducibility: 'Always',
                suggested_fix: 'Use React Router standard patterns'
            });
        }

        return { testedFlows, issues };
    }
}
