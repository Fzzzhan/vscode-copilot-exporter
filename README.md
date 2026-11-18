# GitHub Copilot Chat Exporter

Export your GitHub Copilot chat conversations from VS Code as **JSON** or **Markdown** files.

## Features

- **🎯 Workspace export**: Choose to export conversations from the current workspace or every workspace at once
- **🌍 Cross-platform support**: Works on Windows, Mac, and Linux, including **VS Code Insiders**
- **📝 Multiple export formats**: Export as machine-readable **JSON** or human-readable **Markdown** (or both)
- **📅 Date filter**: Optionally limit the export to conversations from the last N days
- **💬 Session titles**: Each session is labelled with its name (or the first message if no name is set)
- **🔍 Detailed diagnostics**: Shows helpful information when no data is found
- **⚙️ User-configurable**: Customise the default output directory, format, and date filter via VS Code settings

## Installation

Install from VS Code Marketplace: "GitHub Copilot Chat Exporter"

## Usage

1. Open the VS Code workspace you want to export from
2. Click the **"Export Copilot Chat"** button in the status bar, or run the command from the Command Palette
3. Select the **export format** (JSON / Markdown / Both)
4. Choose **which workspaces** to export (current workspace or all workspaces)
5. Optionally enter a **date filter** (e.g. `30` to only export the last 30 days)
6. Pick an **output folder**

## Settings

| Setting | Default | Description |
|---|---|---|
| `copilotExporter.outputDirectory` | `""` | Default output directory. Leave empty to use the workspace or home folder. |
| `copilotExporter.exportFormat` | `"json"` | Default format: `json`, `markdown`, or `both`. |
| `copilotExporter.defaultDaysBack` | `0` | Default days-back filter. `0` means no filter (all time). |

## Version History

### 0.2.0
- Added Markdown export format
- Added multi-workspace export option
- Added date filter (last N days)
- Added session title/name in exports
- Added VS Code Insiders support
- Added user-configurable settings
- Fixed: code blocks are now preserved in exports (were previously stripped)
- Fixed: TypeScript build errors resolved
- Replaced deprecated `vsce` with `@vscode/vsce`

### 0.1.1
- Added cross-platform support
- Improved error handling
- Better user guidance
