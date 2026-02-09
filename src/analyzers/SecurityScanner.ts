import * as fs from 'fs';

export class SecurityScanner {
    private files: string[];

    constructor(projectPath: string, files: string[]) {
        this.files = files;
    }

    public async analyze(): Promise<any[]> {
        const issues: any[] = [];

        for (const file of this.files) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                // Hardcoded Secrets
                if (line.match(/(api_key|secret|password|token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{20,}['"]/i)) {
                    issues.push({
                        id: `SEC-${issues.length + 1}`,
                        title: 'Hardcoded Secret Detected',
                        file: file,
                        line: index + 1,
                        severity: 'Critical',
                        category: 'Security',
                        root_cause: 'Secret committed to source code',
                        impact: 'Credential compromise',
                        reproducibility: 'Always',
                        suggested_fix: 'Use environment variables (.env)'
                    });
                }

                // Eval usage
                if (line.match(/\beval\s*\(/)) {
                    issues.push({
                        id: `SEC-${issues.length + 1}`,
                        title: 'Eval Usage Detected',
                        file: file,
                        line: index + 1,
                        severity: 'High',
                        category: 'Security',
                        root_cause: 'Unsafe code execution',
                        impact: 'Remote Code Execution',
                        reproducibility: 'Always',
                        suggested_fix: 'Refactor to avoid eval()'
                    });
                }

                // HTTP usage
                if (line.match(/http:\/\//) && !line.includes('localhost')) {
                    issues.push({
                        id: `SEC-${issues.length + 1}`,
                        title: 'Insecure HTTP Protocol',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Security',
                        root_cause: 'Unencrypted communication',
                        impact: 'Man-in-the-Middle attacks',
                        reproducibility: 'Always',
                        suggested_fix: 'Use HTTPS'
                    });
                }
            });
        }

        return issues;
    }
}
