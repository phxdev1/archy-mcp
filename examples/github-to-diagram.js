/**
 * Example: Generate a diagram from a GitHub repository
 * 
 * This example demonstrates how to use the Archy MCP server
 * to generate a diagram from a GitHub repository.
 */

// This is a simulation of how you would use the Archy MCP server
// In a real application, you would use the MCP client to call the server
console.log("Example: Generate a diagram from a GitHub repository");
console.log("\nInput:");
console.log("------");

const input = {
  repoUrl: "https://github.com/modelcontextprotocol/typescript-sdk",
  diagramType: "flowchart"
};

console.log(JSON.stringify(input, null, 2));

console.log("\nOutput:");
console.log("-------");

// This is the expected output from the Archy MCP server
const output = `Generated flowchart diagram for modelcontextprotocol/typescript-sdk:

\`\`\`mermaid
flowchart TD
    Client[Client] --> |Connects| Server[MCP Server]
    Server --> |Registers| Tools[Tools]
    Server --> |Registers| Resources[Resources]
    Client --> |Requests| ListTools[List Tools]
    Client --> |Requests| CallTool[Call Tool]
    Client --> |Requests| ListResources[List Resources]
    Client --> |Requests| ReadResource[Read Resource]
    ListTools --> Server
    CallTool --> Server
    ListResources --> Server
    ReadResource --> Server
    Server --> |Responds| Client
\`\`\``;

console.log(output);

console.log("\nTo use this example with the actual MCP server:");
console.log("1. Make sure the Archy MCP server is installed and enabled in your MCP settings");
console.log("2. If you want to access private repositories, add your GitHub token to the MCP settings");
console.log("3. Use the MCP client to call the 'generate_diagram_from_github' tool with the input above");