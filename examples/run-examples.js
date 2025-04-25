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

// Define the examples to run
const examples = [
  'text-to-diagram.js',
  'github-to-diagram.js',
  'list-diagram-types.js'
];

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