#!/usr/bin/env node
/**
 * Run Archy MCP Server Examples
 * 
 * This script runs the example scripts to demonstrate
 * how the Archy MCP server works.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if OpenRouter API key is configured
const hasOpenRouterApiKey = !!process.env.OPENROUTER_API_KEY;

// Define the examples to run
const examples = [
  'text-to-diagram.js',
  'github-to-diagram.js',
  'list-diagram-types.js'
];

// Add AI-powered examples if OpenRouter API key is configured
if (hasOpenRouterApiKey) {
  examples.push('ai-diagram-generation.js');
} else {
  console.log('Note: OpenRouter API key not configured. Skipping AI-powered examples.');
  console.log('To run AI-powered examples, set the OPENROUTER_API_KEY environment variable.\n');
}

// Add image export and repository evolution example
examples.push('image-export-and-evolution.js');

// Run each example
console.log('Running Archy MCP Server Examples\n');
console.log('=================================\n');

examples.forEach((example, index) => {
  const examplePath = path.join(__dirname, example);
  
  console.log(`Example ${index + 1}: ${example}`);
  console.log('-'.repeat(example.length + 12));
  
  try {
    // Run the example and capture the output
    const output = execSync(`node "${examplePath}"`, { encoding: 'utf8' });
    console.log(output);
  } catch (error) {
    console.error(`Error running example ${example}:`, error.message);
  }
  
  if (index < examples.length - 1) {
    console.log('\n' + '='.repeat(50) + '\n');
  }
});

console.log('\nAll examples completed.');
console.log('\nTo use the Archy MCP server with a real MCP client:');
console.log('1. Make sure the server is installed using "npm run install-mcp"');
console.log('2. Use the MCP client to call the tools demonstrated in these examples');