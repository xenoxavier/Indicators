# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **TradingView Indicator MCP (Model Context Protocol) Server** that provides programmatic access to analyze TradingView Pine Script indicators. The project exposes tools via MCP to list, analyze, search, and extract functions from indicator files stored in the repository root directory.

## Core Architecture

### MCP Server Implementation
- **Entry point**: `src/index.ts` - Full-featured MCP server with comprehensive analysis tools
- **Simplified version**: `src/simple-mcp.ts` - Minimal MCP server implementation with basic functionality
- The server uses `@modelcontextprotocol/sdk` for MCP protocol handling
- Runs on stdio transport for Claude Desktop integration
- File operations target the **root directory** where indicator files are stored (not src/)

### Indicator File Management
- **Indicator files**: All Pine Script indicators are stored as individual files in the **root directory**
- File filtering: The code explicitly filters out system files (`.` prefixed, `node_modules`, `.js`, `.ts`, `.json`, `.md`, `Dockerfile`, `package*`, `tsconfig*`, `.rar`)
- Pattern matching: Case-insensitive search and filtering supported

### MCP Tools Available
The server exposes four main tools:

1. **list_indicators**: Lists all indicator files with optional pattern filtering
2. **analyze_indicator**: Performs code analysis extracting:
   - Functions, variables, plots, inputs, alerts
   - Line count and complexity scoring (Low/Medium/High)
   - Complexity thresholds: 100/300 lines, 10/20 functions, 5+ plots
3. **search_indicators**: Searches across all indicator files with line-number matching
4. **extract_functions**: Extracts function definitions with line ranges and full code

### Analysis Engine
Located in `src/index.ts:analyzeIndicatorCode()`:
- Parses Pine Script syntax using regex patterns
- Extracts: functions, variables, plots, inputs, alerts
- Complexity classification based on code metrics
- Results are limited (functions: 10, variables: 15, plots: 10, inputs: 10, alerts: 5)

## Common Commands

### Development
```bash
npm install           # Install dependencies
npm run dev           # Run with tsx (no build needed)
npm run build         # Compile TypeScript to dist/
npm start             # Run compiled server from dist/
```

### Docker Deployment
```bash
./scripts/build.sh    # Full build: npm install + TypeScript + Docker image
docker build -t tradingview-mcp .
docker-compose up     # Run server in container
```

### MCP Configuration
The server is configured for Claude Desktop via `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tradingview-indicators": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "C:\\Users\\msagd\\OneDrive\\Desktop\\indicator"
    }
  }
}
```

## Key Technical Details

### TypeScript Configuration
- **Target**: ES2022 with ESNext modules
- **Module Resolution**: Node-style
- **Output**: `dist/` directory
- **Type Safety**: Strict mode enabled with declaration files

### Dependencies
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Schema validation for tool arguments
- Node.js built-in `fs` and `path` modules for file operations

### Signal Handling
The server implements graceful shutdown:
- SIGINT and SIGTERM handlers properly close the server
- Ensures clean process termination

### Pine Script Analysis Patterns
Function detection: `^[a-zA-Z_][a-zA-Z0-9_]*\s*\(`
Variables: `^(var\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*=`
Plots: Keywords `plot(`, `plotshape(`, `plotchar(`
Inputs: Keywords `input(`, `input.`
Alerts: Keywords `alert(`, `alertcondition(`

## Working with Indicators

When modifying analysis logic:
- Indicator files are in the **root directory**, not subdirectories
- The filtering logic in `getIndicatorFiles()` must exclude system files
- Analysis results are intentionally limited to avoid overwhelming output
- Search functionality provides line numbers and context (max 3 matches per file)
- Function extraction uses brace-counting to find function boundaries (max 50-line scan)

## Docker Notes

- Base image: `node:20-alpine`
- Non-root user: `mcp` (UID 1001)
- Working directory: `/app`
- Volume mount: Root directory mounted to `/app/indicators` (read-only)
- Production builds use `npm ci --only=production`
