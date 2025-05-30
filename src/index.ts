#!/usr/bin/env node
/**
 * Archy - Architectural Diagram Builder MCP Server
 * 
 * This file implements an MCP (Model Context Protocol) server that generates
 * architectural diagrams using Mermaid syntax. The server can process both
 * natural language descriptions and GitHub repository URLs to create various
 * types of diagrams.
 * 
 * @module archy
 * @author Archy Team
 * @version 0.1.0
 */

import { ArchyServer } from './server.js';

// GitHub API token for authenticated requests to the GitHub API.
// If provided, this token will be used to increase rate limits and
// access private repositories.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// OpenRouter API key for AI-powered diagram generation.
// If provided, this enables the AI-powered diagram generation features.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Create an instance of the ArchyServer with the GitHub token and OpenRouter API key
const server = new ArchyServer(GITHUB_TOKEN);

// Log a message if OpenRouter API key is not configured
if (!OPENROUTER_API_KEY) {
  console.warn('OpenRouter API key not configured. AI-powered diagram generation will not be available.');
}

// Run the server and handle any errors
server.run().catch(console.error);

// Export the main components for use in other modules
export * from './server.js';
export * from './generators/text-generator.js';
export * from './generators/github-generator.js';
export * from './generators/langchain-generator.js';
export * from './utils/entity-extractor.js';
export * from './utils/github-api.js';
export * from './langchain/config.js';
export * from './langchain/chains.js';