// Test script for the Archy MCP server
import { spawn } from 'child_process';
import { createInterface } from 'readline';

// Start the MCP server
const server = spawn('node', ['build/index.js']);

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Handle server output
server.stdout.on('data', (data) => {
  console.log(`Server output: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`);
});

// Example MCP request for generating a diagram from text
const generateDiagramRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'callTool',
  params: {
    name: 'generate_diagram_from_text',
    arguments: {
      description: 'A simple flowchart showing user login process',
      diagramType: 'flowchart'
    }
  }
};

// Send the request to the server
console.log('Sending request to generate a diagram...');
server.stdin.write(JSON.stringify(generateDiagramRequest) + '\n');

// Wait for user input to exit
rl.question('Press Enter to exit...', () => {
  server.kill();
  rl.close();
  process.exit(0);
});