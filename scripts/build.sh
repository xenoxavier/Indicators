#!/bin/bash

# Build script for TradingView Indicator MCP Server

echo "Building TradingView Indicator MCP Server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

# Build Docker image
echo "Building Docker image..."
docker build -t tradingview-mcp .

echo "Build complete!"
echo "Run with: docker-compose up"