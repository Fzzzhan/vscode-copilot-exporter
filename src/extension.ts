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

async function getCurrentWorkspaceHash(): Promise<string | null> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }
  
  // Create a hash from the workspace path (VS Code does something similar)
  const workspacePath = folders[0].uri.fsPath;
  
  // Find the matching workspace storage directory
  const workspaceStoragePath = path.join(os.homedir(), '.config', 'Code', 'User', 'workspaceStorage');
  if (!fs.existsSync(workspaceStoragePath)) {
    return null;
  }
  
  const workspaceDirs = fs.readdirSync(workspaceStoragePath);
  
  // Look for directories that might correspond to current workspace
  // VS Code creates workspace hashes, but we can find the right one by checking recent activity
  for (const workspaceDir of workspaceDirs) {
    const chatSessionsPath = path.join(workspaceStoragePath, workspaceDir, 'chatSessions');
    if (fs.existsSync(chatSessionsPath)) {
      // Check if this directory has recent activity
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
          return workspaceDir;
        }
      }
    }
  }
  
  return null;
}

async function scanChatSessionFiles(allEntries: CopilotEntry[]) {
  // Get the current workspace hash
  const currentWorkspaceHash = await getCurrentWorkspaceHash();
  if (!currentWorkspaceHash) {
    return;
  }
  
  const workspaceStoragePath = path.join(os.homedir(), '.config', 'Code', 'User', 'workspaceStorage');
  const workspaceDir = currentWorkspaceHash;
  const chatSessionsPath = path.join(workspaceStoragePath, workspaceDir, 'chatSessions');
  if (fs.existsSync(chatSessionsPath)) {
    const sessionFiles = fs.readdirSync(chatSessionsPath).filter(f => f.endsWith('.json'));
    
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
        // Silently continue if session file cannot be read
      }
    }
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

      // Scan for actual chat session JSON files (main conversations)
      await scanChatSessionFiles(allEntries);

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
        vscode.window.showWarningMessage('No Copilot data found in global storage');
      }

    } catch (error) {
      vscode.window.showErrorMessage('Copilot export failed: ' + String(error));
    }
  });

  context.subscriptions.push(statusBarItem, exportCommand);
}

export function deactivate() {}