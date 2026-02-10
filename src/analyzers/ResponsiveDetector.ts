import * as fs from 'fs';
import * as path from 'path';

export class ResponsiveDetector {
    private files: string[];

    constructor(projectPath: string, files: string[]) {
        this.files = files;
    }

    public async analyze(): Promise<any[]> {
        const issues: any[] = [];

        for (const file of this.files) {
            const lower = file.toLowerCase();

            // Only analyze files where responsiveness matters
            if (!(lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less') || lower.endsWith('.html') || lower.endsWith('.module.css') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx'))) {
                continue;
            }

            let content = '';
            try {
                content = fs.readFileSync(file, 'utf-8');
            } catch (e) {
                continue;
            }

            const lines = content.split('\n');

            // HTML-specific: missing viewport meta
            if (lower.endsWith('.html')) {
                if (!/name\s*=\s*['"]viewport['"]/i.test(content)) {
                    issues.push({
                        id: `RESP-${issues.length + 1}`,
                        title: 'Missing viewport meta tag',
                        file: file,
                        line: 0,
                        severity: 'High',
                        category: 'Responsiveness',
                        root_cause: 'No <meta name="viewport"> found in HTML',
                        impact: 'Site will not scale correctly on mobile devices',
                        reproducibility: 'Always',
                        suggested_fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>'
                    });
                }
            }

            lines.forEach((line, index) => {
                // CSS: overflow properties that may hide content or mask responsive issues
                if (/overflow\s*:\s*(hidden|auto|scroll)/i.test(line)) {
                    issues.push({
                        id: `RESP-${issues.length + 1}`,
                        title: 'Overflow property detected',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Responsiveness',
                        root_cause: line.trim(),
                        impact: 'May hide overflowing content or cause unexpected scroll behavior on small screens',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Review overflow usage and test across breakpoints; avoid globally hiding overflow on body/html'
                    });
                }

                // Fixed sizes in px which often break responsiveness
                if (/(?:^|\W)(?:width|height)\s*:\s*\d+px\b/i.test(line) || /\d+px\s*(?:;|,|\))/i.test(line) && /width|height/i.test(line)) {
                    issues.push({
                        id: `RESP-${issues.length + 1}`,
                        title: 'Fixed size in pixels found',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Responsiveness',
                        root_cause: line.trim(),
                        impact: 'Fixed pixel sizes may not adapt to different screen sizes',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Use relative units (%, em, rem, vw) or add responsive breakpoints'
                    });
                }

                // Inline styles in JSX/TSX: look for style={{ width: '300px' }} or style={{height: "20px"}}
                if (/(style\s*=\s*{{[^}]*\b(width|height)\b[^}]*}})/i.test(line) || /style=\{{1}[^}]*\d+px[^}]*\}{1}/i.test(line)) {
                    issues.push({
                        id: `RESP-${issues.length + 1}`,
                        title: 'Inline fixed pixel style detected',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Responsiveness',
                        root_cause: line.trim(),
                        impact: 'Inline fixed styles are hard to override at different breakpoints',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Move styles to CSS and use responsive units or media queries'
                    });
                }

                // overflow-x and overflow-y specific checks
                if (/overflow-[xy]\s*:\s*(hidden|auto|scroll)/i.test(line)) {
                    issues.push({
                        id: `RESP-${issues.length + 1}`,
                        title: 'Overflow-x/y property detected',
                        file: file,
                        line: index + 1,
                        severity: 'Medium',
                        category: 'Responsiveness',
                        root_cause: line.trim(),
                        impact: 'May truncate content on smaller screens or cause unwanted scrollbars',
                        reproducibility: 'Sometimes',
                        suggested_fix: 'Test on mobile devices and consider wrapping content or using flex/grid'
                    });
                }
            });
        }

        return issues;
    }
}
