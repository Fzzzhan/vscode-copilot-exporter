# VSCode Copilot Exporter

A Visual Studio Code extension that allows you to export your GitHub Copilot interaction history for analysis, backup, or documentation purposes.

## Features

- **Export Copilot Interactions**: Export your Copilot suggestions and code completions to structured formats
- **Multiple Export Formats**: Choose between JSON and CSV formats for your exported data
- **Workspace Analysis**: Analyzes your current workspace to identify potential Copilot-generated code patterns
- **User-Friendly Interface**: Simple command palette integration with progress indicators

## Installation

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Open in VSCode and press `F5` to run the extension in a new Extension Development Host window

### Future: From VSCode Marketplace
(This extension will be available on the VSCode Marketplace once published)

## Usage

### Exporting Copilot History

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Export Copilot History" and select the command
3. Choose your preferred export format (JSON or CSV)
4. Select where to save the exported file
5. The extension will collect and export your Copilot interactions

### Export Formats

#### JSON Format
```json
[
  {
    "timestamp": "2023-12-07T10:30:00.000Z",
    "prompt": "Generate a function to calculate factorial",
    "response": "function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}",
    "file": "example.js",
    "language": "javascript"
  }
]
```

#### CSV Format
```csv
Timestamp,File,Language,Prompt,Response
"2023-12-07T10:30:00.000Z","example.js","javascript","Generate a function to calculate factorial","function factorial(n) {..."
```

## Data Collection

**Important Note**: This extension currently provides a demonstration implementation. In a production environment, accessing actual Copilot interaction history would require:

1. Integration with GitHub Copilot's internal APIs
2. Access to VSCode's extension storage where Copilot data might be cached
3. Event listeners for Copilot completion events
4. Permission from GitHub/Microsoft to access Copilot telemetry data

The current implementation:
- Analyzes your workspace for code patterns that might indicate Copilot usage
- Provides sample data structure for demonstration purposes
- Shows how the export functionality would work with real Copilot data

## Commands

| Command | Description |
|---------|-------------|
| `Export Copilot History` | Opens the export dialog to save your Copilot interaction history |

## Configuration

Currently, this extension doesn't require any configuration. Future versions may include:
- Export format preferences
- Data retention settings
- Privacy controls
- Custom export templates

## Privacy and Security

- All data processing happens locally on your machine
- No data is sent to external servers
- You have full control over what gets exported and where it's saved
- The extension only accesses workspace files you have open in VSCode

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Visual Studio Code

### Building from Source
```bash
git clone https://github.com/Fzzzhan/vscode-copilot-exporter.git
cd vscode-copilot-exporter
npm install
npm run compile
```

### Testing
Open the project in VSCode and press `F5` to launch a new Extension Development Host window where you can test the extension.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Real Copilot API integration
- [ ] Advanced filtering and search capabilities
- [ ] Export templates and customization
- [ ] Statistics and analytics dashboard
- [ ] Integration with other AI coding assistants
- [ ] Automated backup scheduling

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/Fzzzhan/vscode-copilot-exporter/issues) on GitHub.

## Acknowledgments

- Thanks to the VSCode team for providing excellent extension APIs
- Thanks to GitHub Copilot for revolutionizing AI-assisted coding
- Inspired by the need for transparency and data portability in AI tools