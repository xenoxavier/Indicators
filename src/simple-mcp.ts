#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";

// Simple MCP server for TradingView indicators
const server = new Server(
  {
    name: "tradingview-indicators",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool argument schemas
const ListIndicatorsSchema = z.object({
  pattern: z.string().optional(),
});

const AnalyzeIndicatorSchema = z.object({
  indicatorName: z.string(),
});

// Helper function to get indicator files
function getIndicatorFiles(pattern?: string): string[] {
  try {
    const files = readdirSync(".");
    return files.filter(file => {
      // Filter out system files
      if (file.startsWith('.') || file.includes('node_modules') ||
          file.endsWith('.js') || file.endsWith('.ts') ||
          file.endsWith('.json') || file.endsWith('.md') ||
          file.includes('package') || file.includes('tsconfig') ||
          file.includes('Dockerfile') || file.endsWith('.rar')) {
        return false;
      }

      if (pattern) {
        return file.toLowerCase().includes(pattern.toLowerCase());
      }
      return true;
    });
  } catch (error) {
    return [];
  }
}

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_indicators",
        description: "List all TradingView indicator files",
        inputSchema: ListIndicatorsSchema,
      },
      {
        name: "analyze_indicator",
        description: "Analyze a TradingView indicator file",
        inputSchema: AnalyzeIndicatorSchema,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_indicators": {
      const { pattern } = ListIndicatorsSchema.parse(args);
      const indicators = getIndicatorFiles(pattern);

      return {
        content: [
          {
            type: "text",
            text: `Found ${indicators.length} indicator files:\n\n${indicators.map((file, i) => `${i + 1}. ${file}`).join('\n')}`,
          },
        ],
      };
    }

    case "analyze_indicator": {
      const { indicatorName } = AnalyzeIndicatorSchema.parse(args);

      try {
        const content = readFileSync(indicatorName, 'utf-8');
        const lines = content.split('\n');

        // Simple analysis
        const functions = lines.filter(line => line.trim().match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/));
        const plots = lines.filter(line => line.includes('plot('));
        const inputs = lines.filter(line => line.includes('input'));

        const analysis = `# Analysis of ${indicatorName}

## File Stats
- Lines: ${lines.length}
- Functions: ${functions.length}
- Plots: ${plots.length}
- Inputs: ${inputs.length}

## Key Functions Found
${functions.slice(0, 5).map(f => `- ${f.trim().split('(')[0]}`).join('\n') || 'None found'}

## Plot Commands
${plots.slice(0, 3).map(p => `- ${p.trim()}`).join('\n') || 'None found'}
`;

        return {
          content: [
            {
              type: "text",
              text: analysis,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading file "${indicatorName}": ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);