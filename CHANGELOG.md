# Changelog

All notable changes to the "vscode-copilot-exporter" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2023-12-07

### Added
- Initial release of VSCode Copilot Exporter extension
- Command to export Copilot interaction history
- Support for JSON and CSV export formats
- Progress indicator during export process
- Workspace analysis for potential Copilot-generated code
- File dialog for selecting export location
- Sample data structure for demonstration purposes
- Comprehensive README documentation
- TypeScript implementation with proper error handling

### Features
- **Export Command**: `copilot-exporter.exportHistory` command accessible via Command Palette
- **Multi-format Export**: Users can choose between JSON and CSV formats
- **User Experience**: Progress notifications and success messages
- **File Management**: Save dialog with appropriate file filters
- **Error Handling**: Graceful error handling with user-friendly messages

### Technical Details
- Built with TypeScript
- Uses VSCode Extension API
- Follows VSCode extension best practices
- Includes proper build configuration and scripts

### Known Limitations
- Currently uses demonstration data as real Copilot API integration requires additional permissions
- Workspace analysis provides approximated data based on code patterns
- Future versions will include real Copilot telemetry integration when APIs become available