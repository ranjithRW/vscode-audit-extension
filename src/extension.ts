import * as vscode from 'vscode';
import { ProjectAuditor } from './auditor/ProjectAuditor';

export function activate(context: vscode.ExtensionContext) {
    console.log('React Flow Auditor is now active!');

    let disposable = vscode.commands.registerCommand('audit.analyze', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        vscode.window.showInformationMessage(`Starting audit regarding ${projectPath}...`);

        try {
            const auditor = new ProjectAuditor(projectPath);
            const report = await auditor.audit();

            // For now, just show the JSON in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: JSON.stringify(report, null, 2),
                language: 'json'
            });
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage('Audit complete!');
        } catch (error) {
            vscode.window.showErrorMessage(`Audit failed: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }
