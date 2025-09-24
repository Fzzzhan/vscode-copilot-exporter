/**
 * @Author: Fengze Han
 * @Date:   2025-09-24 00:14:34
 * @Last Modified by:   Fengze Han
 * @Last Modified time: 2025-09-24 10:45:39
 */
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface CopilotEntry {
  key: string;
  content: any;
  timestamp?: string;
  workspace?: string;
  type?: string;
}

function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove technical markers and symbols
    .replace(/```[\w]*\n?/g, '') // Remove code block markers
    .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks  
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\s+/g, ' '); // Normalize spaces
}

function getVSCodeStoragePath(): string {
  const platform = os.platform();
  const homedir = os.homedir();
  
  switch (platform) {
    case 'win32':
      return path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'workspaceStorage');
    case 'darwin':
      return path.join(homedir, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage');
    default: // Linux and others
      return path.join(homedir, '.config', 'Code', 'User', 'workspaceStorage');
  }
}

async function getCurrentWorkspaceHash(): Promise<{ hash: string | null; diagnostics: string[] }> {
  const diagnostics: string[] = [];
  const folders = vscode.workspace.workspaceFolders;
  
  if (!folders || folders.length === 0) {
    diagnostics.push('No workspace folder is currently open');
    return { hash: null, diagnostics };
  }
  
  const workspacePath = folders[0].uri.fsPath;
  diagnostics.push(`Current workspace: ${workspacePath}`);
  
  // Find the matching workspace storage directory
  const workspaceStoragePath = getVSCodeStoragePath();
  diagnostics.push(`Checking VS Code storage: ${workspaceStoragePath}`);
  
  if (!fs.existsSync(workspaceStoragePath)) {
    diagnostics.push('VS Code workspace storage directory not found');
    return { hash: null, diagnostics };
  }
  
  const workspaceDirs = fs.readdirSync(workspaceStoragePath);
  diagnostics.push(`Found ${workspaceDirs.length} workspace directories`);
  
  // Look for directories that might correspond to current workspace
  let candidatesWithChat = 0;
  for (const workspaceDir of workspaceDirs) {
    const chatSessionsPath = path.join(workspaceStoragePath, workspaceDir, 'chatSessions');
    if (fs.existsSync(chatSessionsPath)) {
      candidatesWithChat++;
      const sessionFiles = fs.readdirSync(chatSessionsPath).filter(f => f.endsWith('.json'));
      if (sessionFiles.length > 0) {
        // Check the most recent file modification time
        let mostRecentTime = 0;
        for (const file of sessionFiles) {
          const stat = fs.statSync(path.join(chatSessionsPath, file));
          if (stat.mtime.getTime() > mostRecentTime) {
            mostRecentTime = stat.mtime.getTime();
          }
        }
        
        // If recent activity (within last 30 days), this might be our workspace
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (mostRecentTime > thirtyDaysAgo) {
          diagnostics.push(`Found matching workspace with ${sessionFiles.length} chat sessions`);
          return { hash: workspaceDir, diagnostics };
        }
      }
    }
  }
  
  diagnostics.push(`Found ${candidatesWithChat} directories with chat sessions, but none recent`);
  return { hash: null, diagnostics };
}

async function scanChatSessionFiles(allEntries: CopilotEntry[], diagnostics: string[]) {
  // Get the current workspace hash
  const workspaceResult = await getCurrentWorkspaceHash();
  if (!workspaceResult.hash) {
    diagnostics.push(...workspaceResult.diagnostics);
    return;
  }
  
  const currentWorkspaceHash = workspaceResult.hash;
  diagnostics.push(...workspaceResult.diagnostics);
  
  const workspaceStoragePath = getVSCodeStoragePath();
  const workspaceDir = currentWorkspaceHash;
  const chatSessionsPath = path.join(workspaceStoragePath, workspaceDir, 'chatSessions');
  
  diagnostics.push(`Looking for chat sessions in: ${chatSessionsPath}`);
  
  if (fs.existsSync(chatSessionsPath)) {
    const sessionFiles = fs.readdirSync(chatSessionsPath).filter(f => f.endsWith('.json'));
    diagnostics.push(`Found ${sessionFiles.length} JSON session files`);
    
    for (const sessionFile of sessionFiles) {
      try {
        const filePath = path.join(chatSessionsPath, sessionFile);
        const content = await readFile(filePath, 'utf8');
        const chatSession = JSON.parse(content);
        
        if (chatSession.requests && chatSession.requests.length > 0) {
          // Process each request-response pair
          for (let i = 0; i < chatSession.requests.length; i++) {
            const request = chatSession.requests[i];
            
            if (request.message && request.message.text) {
              // Extract user message (clean text only)
              const userMessage = cleanText(request.message.text);
              
              // Extract Copilot response (array of response objects)
              let copilotResponse = 'No response';
              if (request.response && Array.isArray(request.response)) {
                // Concatenate all response parts
                const responseParts: string[] = [];
                for (const responsePart of request.response) {
                  if (responsePart && responsePart.value && typeof responsePart.value === 'string') {
                    responseParts.push(cleanText(responsePart.value));
                  }
                }
                if (responseParts.length > 0) {
                  copilotResponse = responseParts.join(' ').trim();
                }
              }
              
              // Only add if we have meaningful content
              if (userMessage.length > 10 && copilotResponse.length > 10) {
                allEntries.push({
                  key: `conversation-${i + 1}`,
                  content: {
                    session: chatSession.sessionId.substring(0, 8),
                    date: new Date(chatSession.creationDate).toLocaleDateString(),
                    human: userMessage,
                    copilot: copilotResponse
                  },
                  workspace: currentWorkspaceHash,
                  type: 'conversation'
                });
              }
            }
          }
        }
      } catch (error) {
        diagnostics.push(`Error reading session file ${sessionFile}: ${error}`);
      }
    }
    
    const conversationCount = allEntries.length;
    diagnostics.push(`Processed files and found ${conversationCount} valid conversations`);
  } else {
    diagnostics.push('Chat sessions directory does not exist');
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Status bar button
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(file-code) Export Copilot Chat";
  statusBarItem.command = 'copilot-exporter.exportWorkspaceHistory';
  statusBarItem.tooltip = "Export GitHub Copilot chat history";
  statusBarItem.show();

  const exportCommand = vscode.commands.registerCommand('copilot-exporter.exportWorkspaceHistory', async () => {
    try {
      // Get output directory
      const folders = vscode.workspace.workspaceFolders || [];
      const defaultOut = folders.length ? path.join(folders[0].uri.fsPath, 'copilot_exports') : path.join(os.homedir(), 'copilot_exports');

      const outUri = await vscode.window.showOpenDialog({ 
        canSelectFolders: true, 
        canSelectFiles: false, 
        openLabel: 'Select output folder' 
      });
      
      const outDir = outUri ? outUri[0].fsPath : defaultOut;
      await mkdir(outDir, { recursive: true });

      let allEntries: CopilotEntry[] = [];
      let diagnostics: string[] = [];

      // Scan for actual chat session JSON files (main conversations)
      await scanChatSessionFiles(allEntries, diagnostics);

      // Export to JSON
      if (allEntries.length > 0) {
        const outputFile = path.join(outDir, `copilot_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        await writeFile(outputFile, JSON.stringify(allEntries, null, 2), 'utf8');
        
        const message = `Copilot export complete! ${allEntries.length} entries exported to ${outputFile}`;
        const action = await vscode.window.showInformationMessage(message, 'Open File', 'Open Folder');
        
        if (action === 'Open File') {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(outputFile));
        } else if (action === 'Open Folder') {
          vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outDir));
        }
      } else {
        // Create detailed diagnostic report
        const diagnosticReport = [
          '🔍 **Copilot Export Diagnostics**',
          '',
          '**Search Details:**',
          ...diagnostics.map(d => `• ${d}`),
          '',
          '**Possible Solutions:**',
          '• Make sure you have used GitHub Copilot Chat in this workspace',
          '• Try opening a different workspace where you\'ve used Copilot',
          '• Check if VS Code is storing data in a custom location',
          '• On Windows, data might be in a different AppData folder',
          '• The extension looks for chat sessions from the last 30 days'
        ].join('\n');

        // Save diagnostic report
        const diagnosticFile = path.join(outDir, `copilot_export_diagnostics_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
        await writeFile(diagnosticFile, diagnosticReport, 'utf8');
        
        const action = await vscode.window.showWarningMessage(
          'No Copilot data found. Click "View Details" to see diagnostic information.', 
          'View Details', 
          'Close'
        );
        
        if (action === 'View Details') {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(diagnosticFile));
        }
      }

    } catch (error) {
      vscode.window.showErrorMessage('Copilot export failed: ' + String(error));
    }
  });

  context.subscriptions.push(statusBarItem, exportCommand);
}

export function deactivate() {}