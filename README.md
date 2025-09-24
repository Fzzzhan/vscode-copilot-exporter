<<<<<<< HEAD
# GitHub Copilot Chat Exporter

Export your GitHub Copilot chat conversations from your current workspace as clean, readable JSON files. Perfect for backing up your coding conversations or analyzing your development patterns.

## ✨ Features

- 🚀 **One-Click Export** - Status bar button for instant access
- 🎯 **Workspace-Specific** - Only exports conversations from your current project
- 🧹 **Clean Text** - Removes markdown, code blocks, and formatting for natural language output
- 📁 **Smart Filtering** - Only includes meaningful conversations with substantial content
- 💾 **JSON Format** - Structured data that's easy to read and process

## 🚀 Quick Start

1. **Install** the extension from the marketplace
2. **Use GitHub Copilot** in your current workspace (if you haven't already)
3. **Click** the "Export Copilot Chat" button in the status bar
4. **Choose** where to save your export file
5. **Done!** Open the file to view your conversations

## 📋 Output Format

Your conversations are exported as clean JSON:

```json
[
  {
    "key": "conversation-1",
    "content": {
      "session": "abc12345",
      "date": "9/24/2025",
      "human": "How do I create a React component?",
      "copilot": "To create a React component, you can use either function or class syntax..."
    },
    "workspace": "workspace_hash",
    "type": "conversation"
  }
]
```

## 🔧 Requirements

- VS Code 1.70.0+
- GitHub Copilot extension installed
- Some chat history with Copilot in your workspace


## 📝 Release Notes

### 0.1.0
- Production-ready release with cleaned codebase
- Removed unnecessary dependencies and debug code
- Improved documentation


**Enjoy exporting your Copilot conversations!** 🎉
