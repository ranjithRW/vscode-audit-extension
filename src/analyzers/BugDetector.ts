import * as fs from 'fs';

export class BugDetector {
    private files: string[];

    constructor(projectPath: string, files: string[]) {
        this.files = files;
    }

    public async analyze(): Promise<any[]> {
        const bugs: any[] = [];

        for (const file of this.files) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // Check for console.log
                if (line.includes('console.log')) {
                    bugs.push({
                        id: `BUG-${bugs.length + 1}`,
                        title: 'Console Log Detected',
                        file: file,
                        line: index + 1,
                        severity: 'Low',
                        category: 'Code Quality',
                        root_cause: 'Developer debugging remnant',
                        impact: 'Clutters production logs',
                        reproducibility: 'Always',
                        suggested_fix: 'Remove console.log statements'
                    });
                }

                // Check for dangerouslySetInnerHTML (also a security issue, but can cause bugs if malformed)
                if (line.includes('dangerouslySetInnerHTML')) {
                    bugs.push({
                        id: `BUG-${bugs.length + 1}`,
                        title: 'Dangerous HTML Injection',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Security/Bug',
                        root_cause: 'Direct DOM manipulation',
                        impact: 'XSS Vulnerability and React rendering issues',
                        reproducibility: 'Always',
                        suggested_fix: 'Use React components or sanitize input'
                    });
                }

                // Check for useEffect missing dependency array (heuristic)
                // This is a naive check; a real AST parser would be better
                if (line.includes('useEffect(() => {') && !line.includes('}, [')) {
                    // logic to check *next* lines for dependency array closing would be needed for multiline
                    // skipping for now to keep simple regex
                }
            });

            // Heuristic: Check for hooks inside loops (very naive)
            if (content.match(/for\s*\(.*\)\s*{[^}]*use[A-Z]/)) {
                bugs.push({
                    id: `BUG-${bugs.length + 1}`,
                    title: 'Hook Called in Loop',
                    file: file,
                    line: 0, // difficult to pinpoint line with simple regex
                    severity: 'Critical',
                    category: 'React Violation',
                    root_cause: 'Hooks rules violation',
                    impact: 'Unpredictable component behavior',
                    reproducibility: 'Always',
                    suggested_fix: 'Move hook call to top level'
                });
            }
        }

        return bugs;
    }
}
