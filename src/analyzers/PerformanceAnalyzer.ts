import * as fs from 'fs';

export class PerformanceAnalyzer {
    private files: string[];

    constructor(projectPath: string, files: string[]) {
        this.files = files;
    }

    public async analyze(): Promise<any[]> {
        const issues: any[] = [];

        for (const file of this.files) {
            let content = '';
            try {
                content = fs.readFileSync(file, 'utf-8');
            } catch (e) {
                continue;
            }

            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // Detection 1: Large bundle size indicators (multiple large imports)
                if (/(import|require)\s*\(\s*['"][^'"]*node_modules[^'"]*['"]\s*\)/i.test(line)) {
                    // Count large library imports
                    if (/lodash|moment|axios|react-dom|styled-components/i.test(line)) {
                        issues.push({
                            id: `PERF-${issues.length + 1}`,
                            title: 'Large library import detected',
                            file: file,
                            line: index + 1,
                            severity: 'Low',
                            category: 'Performance',
                            root_cause: line.trim(),
                            impact: 'May increase bundle size; consider tree-shaking or lazy loading',
                            reproducibility: 'Always',
                            suggested_fix: 'Use dynamic imports, tree-shake unused code, or consider lighter alternatives'
                        });
                    }
                }

                // Detection 2: Missing key prop in loops/maps (React)
                if (/\.map\s*\(\s*\([^)]*\)\s*=>\s*<.*key=["']?i(ndex)?["']?/i.test(line)) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'Using array index as key in map',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Performance',
                        root_cause: 'Array index used as React key',
                        impact: 'Can cause unnecessary re-renders and list reordering issues',
                        reproducibility: 'Always',
                        suggested_fix: 'Use unique, stable identifiers (e.g., item.id) instead of array index'
                    });
                }

                // Detection 3: Missing key in list rendering
                if (/\{\s*.*\.map\s*\([^)]*\)\s*=>\s*\(</.test(line) && !line.includes('key=')) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'Missing key prop in list rendering',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Performance',
                        root_cause: 'List rendering without key prop',
                        impact: 'Causes component re-creation on every render cycle',
                        reproducibility: 'Always',
                        suggested_fix: 'Add unique `key` prop to each rendered element'
                    });
                }

                // Detection 4: N+1 query patterns (suspected)
                if (/for\s*\([^)]*\)\s*{[^}]*fetch|for\s*\([^)]*\)\s*{[^}]*axios|for\s*\([^)]*\)\s*{[^}]*\.query/i.test(line)) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'Potential N+1 query pattern detected',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Performance',
                        root_cause: 'Loop with API/DB query inside may cause N+1 problem',
                        impact: 'High database load and slow response times',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Batch queries or fetch data before loop'
                    });
                }

                // Detection 5: Inefficient string concatenation in loops
                if (/for\s*\([^)]*\)\s*{[^}]*\+=|while\s*\([^)]*\)\s*{[^}]*\+=/i.test(line)) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'String concatenation in loop',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Performance',
                        root_cause: 'String concatenation (+=) inside loop creates new string objects',
                        impact: 'Slower performance and increased memory usage',
                        reproducibility: 'Always',
                        suggested_fix: 'Use array.join() or template literals with array methods'
                    });
                }

                // Detection 6: Synchronous operations blocking main thread
                if (/fs\.readFileSync|fs\.writeFileSync|require\s*\(\s*['"]child_process['"]\s*\)\.exec/i.test(line)) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'Synchronous blocking operation detected',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Performance',
                        root_cause: line.trim(),
                        impact: 'Blocks event loop and freezes application',
                        reproducibility: 'Always',
                        suggested_fix: 'Use async versions (fs.readFile, fs.promises, Promise-based APIs)'
                    });
                }

                // Detection 7: Global variables/mutable state
                if (/^(var|let|const)\s+[A-Z_][A-Z_0-9]*\s*=\s*(\{|\[|[^;]*=>\s*\{)/i.test(line) && !line.includes('const')) {
                    if (line.match(/^\s*(var|let)\s+/)) {
                        issues.push({
                            id: `PERF-${issues.length + 1}`,
                            title: 'Non-const mutable state at top level',
                            file: file,
                            line: index + 1,
                            severity: 'Medium',
                            category: 'Performance',
                            root_cause: 'Global or top-level mutable variables',
                            impact: 'Can cause memory leaks and unexpected state mutations',
                            reproducibility: 'Sometimes',
                            suggested_fix: 'Use const with immutable patterns or state management'
                        });
                    }
                }

                // Detection 8: Missing React.memo or useMemo for expensive renders
                if (/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?return\s*<[\s\S]*?for|\.map\s*\([^)]*\)\s*[\s\S]*?<.*\)/.test(function() { return content.substring(Math.max(0, index * 80 - 500), (index + 1) * 80 + 500); }())) {
                    // Skip complex heuristic for now
                }

                // Detection 9: Missing error boundaries or try-catch in async operations
                if (/await|\.then\s*\(/i.test(line) && !lines.some((l, i) => i >= index - 5 && i <= index + 5 && /try|catch/i.test(l))) {
                    issues.push({
                        id: `PERF-${issues.length + 1}`,
                        title: 'Async operation without error handling',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Performance',
                        root_cause: 'Unhandled promise rejection',
                        impact: 'Can crash application or leave resources hanging',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Wrap async operations in try-catch or .catch() handler'
                    });
                }

                // Detection 10: Large dependency on single file 
                if (file.includes('index.ts') || file.includes('App.tsx')) {
                    // Skip - need to calculate file size
                }
            });
        }

        return issues;
    }
}
