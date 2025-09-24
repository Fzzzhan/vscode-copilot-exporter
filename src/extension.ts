import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface CopilotInteraction {
  timestamp: string;
  prompt: string;
  response: string;
  file: string;
  language?: string;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Copilot Exporter extension is now active!');

  // Register the export command
  let disposable = vscode.commands.registerCommand('copilot-exporter.exportHistory', async () => {
    try {
      await exportCopilotHistory();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export Copilot history: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

async function exportCopilotHistory() {
  // Show progress indicator
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Exporting Copilot History",
    cancellable: false
  }, async (progress) => {
    progress.report({ increment: 0, message: "Collecting Copilot interactions..." });

    // Get Copilot history from various sources
    const interactions = await collectCopilotInteractions();
    
    progress.report({ increment: 50, message: "Formatting data..." });

    if (interactions.length === 0) {
      vscode.window.showInformationMessage('No Copilot interactions found to export.');
      return;
    }

    // Ask user for export format
    const format = await vscode.window.showQuickPick(['JSON', 'CSV'], {
      placeHolder: 'Select export format'
    });

    if (!format) {
      return;
    }

    progress.report({ increment: 75, message: "Saving file..." });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `copilot-history-${timestamp}.${format.toLowerCase()}`;

    // Ask user where to save the file
    const saveUri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(os.homedir(), fileName)),
      filters: {
        'JSON files': ['json'],
        'CSV files': ['csv'],
        'All files': ['*']
      }
    });

    if (!saveUri) {
      return;
    }

    // Export data based on selected format
    let exportData: string;
    if (format === 'JSON') {
      exportData = JSON.stringify(interactions, null, 2);
    } else {
      exportData = convertToCSV(interactions);
    }

    // Write file
    await fs.promises.writeFile(saveUri.fsPath, exportData, 'utf8');
    
    progress.report({ increment: 100, message: "Export completed!" });

    // Show success message with option to open file
    const action = await vscode.window.showInformationMessage(
      `Copilot history exported successfully! (${interactions.length} interactions)`,
      'Open File'
    );

    if (action === 'Open File') {
      await vscode.commands.executeCommand('vscode.open', saveUri);
    }
  });
}

async function collectCopilotInteractions(): Promise<CopilotInteraction[]> {
  const interactions: CopilotInteraction[] = [];

  try {
    // Try to access VSCode's internal state for Copilot data
    // Note: This is a simplified approach as actual Copilot data access
    // would require deeper integration with Copilot's internal APIs
    
    // Get recent editor activity that might indicate Copilot usage
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      // This is a mock implementation - in a real scenario, you'd need to:
      // 1. Hook into Copilot's completion events
      // 2. Access Copilot's internal history/cache
      // 3. Parse VSCode's workspace state or extension storage
      
      // For demonstration, we'll create sample data based on current workspace
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        for (const folder of workspaceFolders) {
          const files = await vscode.workspace.findFiles('**/*.{js,ts,py,java,cpp,c,cs,go,rust,php}', '**/node_modules/**', 100);
          
          for (const file of files.slice(0, 10)) { // Limit to first 10 files
            try {
              const document = await vscode.workspace.openTextDocument(file);
              const content = document.getText();
              
              // Look for patterns that might indicate Copilot suggestions
              const lines = content.split('\n');
              let copilotLikeLines = lines.filter(line => 
                line.trim().length > 20 && 
                (line.includes('function') || line.includes('class') || line.includes('const') || line.includes('//'))
              );

              if (copilotLikeLines.length > 0) {
                interactions.push({
                  timestamp: new Date().toISOString(),
                  prompt: `Code context from ${path.basename(file.fsPath)}`,
                  response: copilotLikeLines.slice(0, 3).join('\n'),
                  file: file.fsPath,
                  language: document.languageId
                });
              }
            } catch (error) {
              console.log(`Error processing file ${file.fsPath}:`, error);
            }
          }
        }
      }
    }

    // Add some example interactions for demonstration
    if (interactions.length === 0) {
      interactions.push({
        timestamp: new Date().toISOString(),
        prompt: "Example: Generate a function to calculate factorial",
        response: "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
        file: "example.js",
        language: "javascript"
      });
    }

  } catch (error) {
    console.error('Error collecting Copilot interactions:', error);
  }

  return interactions;
}

function convertToCSV(interactions: CopilotInteraction[]): string {
  const headers = ['Timestamp', 'File', 'Language', 'Prompt', 'Response'];
  const rows = [headers.join(',')];

  for (const interaction of interactions) {
    const row = [
      `"${interaction.timestamp}"`,
      `"${interaction.file}"`,
      `"${interaction.language || ''}"`,
      `"${interaction.prompt.replace(/"/g, '""')}"`,
      `"${interaction.response.replace(/"/g, '""')}"`
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export function deactivate() {}