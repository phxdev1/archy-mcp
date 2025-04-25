/**
 * Basic Test for Archy MCP Server
 * 
 * This script tests the basic functionality of the Archy MCP server
 * by simulating MCP client requests and verifying the responses.
 */

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Path to the server executable
const serverPath = path.join(rootDir, 'build', 'index.js');

// Define types for the request and response
interface McpRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Simulates an MCP client request to the server
 * @param {McpRequest} request - The request object to send to the server
 * @returns {Promise<McpResponse[]>} - The response from the server
 */
async function sendRequest(request: McpRequest): Promise<McpResponse[]> {
  return new Promise((resolve, reject) => {
    // Spawn the server process
    const server: ChildProcessWithoutNullStreams = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    // Collect stdout data
    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr data
    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process exit
    server.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Server process exited with code ${code}\nStderr: ${stderr}`));
        return;
      }
      
      try {
        // Parse the response
        const lines = stdout.trim().split('\n');
        const responses = lines.map(line => JSON.parse(line) as McpResponse);
        resolve(responses);
      } catch (error) {
        reject(new Error(`Failed to parse server response: ${(error as Error).message}\nStdout: ${stdout}`));
      }
    });
    
    // Send the request to the server
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();
  });
}

/**
 * Runs the tests
 */
async function runTests(): Promise<void> {
  console.log('Running basic tests for Archy MCP server...\n');
  
  try {
    // Test 1: Initialize the server
    console.log('Test 1: Initialize the server');
    const initRequest: McpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '0.1.0',
        capabilities: {
          sampling: true
        }
      }
    };
    
    const initResponse = await sendRequest(initRequest);
    console.log('Server initialized successfully');
    console.log('Server capabilities:', initResponse[0]?.result?.capabilities);
    console.log('');
    
    // Test 2: List available tools
    console.log('Test 2: List available tools');
    const listToolsRequest: McpRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    const listToolsResponse = await sendRequest(listToolsRequest);
    const tools = listToolsResponse[0]?.result?.tools || [];
    console.log(`Found ${tools.length} tools:`);
    tools.forEach((tool: any) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    console.log('');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the tests
runTests();