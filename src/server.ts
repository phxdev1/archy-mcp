/**
 * Archy MCP Server
 * 
 * This file implements the core functionality of the Archy MCP server.
 * It handles the setup of the MCP server, defines the available tools,
 * and implements the logic for generating architectural diagrams.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { AxiosInstance } from 'axios';

import { createGitHubApiClient, fetchRepositoryData, extractRepoInfoFromUrl } from './utils/github-api.js';
import { generateDiagramFromText } from './generators/text-generator.js';
import { generateDiagramFromGithub } from './generators/github-generator.js';

/**
 * Archy MCP Server
 * 
 * This class implements the core functionality of the Archy MCP server.
 * It handles the setup of the MCP server, defines the available tools,
 * and implements the logic for generating architectural diagrams.
 * 
 * The server provides the following tools:
 * - generate_diagram_from_text: Creates a diagram from a text description
 * - generate_diagram_from_github: Creates a diagram from a GitHub repository
 * - list_supported_diagram_types: Lists all supported diagram types with descriptions
 * 
 * @class ArchyServer
 */
export class ArchyServer {
  /**
   * The MCP server instance from the SDK
   * @private
   * @type {Server}
   */
  private server: Server;

  /**
   * Axios instance for making HTTP requests to external APIs
   * @private
   * @type {AxiosInstance}
   */
  private axiosInstance: AxiosInstance;

  /**
   * Creates a new instance of the ArchyServer.
   * 
   * This constructor initializes the MCP server with the necessary configuration,
   * sets up the axios instance for HTTP requests, configures the tool handlers,
   * and sets up error handling.
   * 
   * @constructor
   * @param {string|undefined} githubToken - GitHub API token for authenticated requests
   */
  constructor(githubToken?: string) {
    // Initialize the MCP server with server information and capabilities
    this.server = new Server(
      {
        name: 'archy',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {}, // Tool capabilities will be registered in setupToolHandlers
        },
      }
    );

    // Configure axios instance for making HTTP requests to GitHub API
    this.axiosInstance = createGitHubApiClient(githubToken);

    // Set up the tool handlers for the MCP server
    this.setupToolHandlers();
    
    // Configure error handling for the server
    // Log errors to the console for debugging
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    // Handle SIGINT signal (Ctrl+C) to gracefully shut down the server
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up the tool handlers for the MCP server.
   * 
   * This method registers the request handlers for listing available tools
   * and handling tool calls. It defines the tools that the server provides
   * and their input schemas.
   * 
   * @private
   * @returns {void}
   */
  private setupToolHandlers(): void {
    // Register handler for listing available tools
    // This handler responds to the ListTools request with a list of tools
    // that this server provides, along with their descriptions and input schemas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_diagram_from_text',
          description: 'Generate a Mermaid diagram from a text description',
          inputSchema: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Text description of the diagram to generate',
              },
              diagramType: {
                type: 'string',
                description: 'Type of diagram to generate (flowchart, class, sequence, etc.)',
                enum: [
                  'flowchart', 
                  'sequenceDiagram', 
                  'classDiagram', 
                  'stateDiagram', 
                  'entityRelationshipDiagram',
                  'userJourney',
                  'gantt',
                  'pieChart',
                  'quadrantChart',
                  'requirementDiagram',
                  'gitGraph',
                  'c4Diagram'
                ]
              }
            },
            required: ['description', 'diagramType'],
          },
        },
        {
          name: 'generate_diagram_from_github',
          description: 'Generate a Mermaid diagram from a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              repoUrl: {
                type: 'string',
                description: 'URL of the GitHub repository',
              },
              diagramType: {
                type: 'string',
                description: 'Type of diagram to generate (flowchart, class, sequence, etc.)',
                enum: [
                  'flowchart', 
                  'sequenceDiagram', 
                  'classDiagram', 
                  'stateDiagram', 
                  'entityRelationshipDiagram',
                  'userJourney',
                  'gantt',
                  'pieChart',
                  'quadrantChart',
                  'requirementDiagram',
                  'gitGraph',
                  'c4Diagram'
                ]
              }
            },
            required: ['repoUrl', 'diagramType'],
          },
        },
        {
          name: 'list_supported_diagram_types',
          description: 'List all supported diagram types with descriptions',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    }));

    // Register handler for tool calls
    // This handler processes requests to call a specific tool with arguments
    // and routes the request to the appropriate method based on the tool name
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'generate_diagram_from_text':
          return this.handleGenerateDiagramFromText(request.params.arguments);
        
        case 'generate_diagram_from_github':
          return this.handleGenerateDiagramFromGithub(request.params.arguments);
        
        case 'list_supported_diagram_types':
          return this.handleListSupportedDiagramTypes();
        
        default:
          // If the requested tool is not recognized, throw a MethodNotFound error
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  /**
   * Handle the generate_diagram_from_text tool request.
   * 
   * This method processes a request to generate a diagram from a text description.
   * It validates the input arguments, generates a Mermaid diagram based on the
   * specified diagram type and description, and returns the result.
   * 
   * @private
   * @async
   * @param {any} args - The arguments for the tool call
   * @param {string} args.description - The text description to generate a diagram from
   * @param {string} args.diagramType - The type of diagram to generate
   * @returns {Promise<object>} A promise that resolves to the tool response
   * @throws {McpError} If the required parameters are missing
   */
  private async handleGenerateDiagramFromText(args: any): Promise<object> {
    // Validate that the required arguments are provided
    if (!args.description || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: description and diagramType'
      );
    }

    try {
      // Generate a diagram based on the text description and diagram type
      const mermaidCode = generateDiagramFromText(args.diagramType, args.description);
      
      // Return the generated diagram as Mermaid code
      // The content is formatted as a markdown code block with the mermaid language
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram from text description:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      // If an error occurs during diagram generation, return an error response
      return {
        content: [
          {
            type: 'text',
            text: `Error generating diagram: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle the generate_diagram_from_github tool request.
   * 
   * This method processes a request to generate a diagram from a GitHub repository.
   * It validates the input arguments, extracts the repository owner and name from the URL,
   * and generates a Mermaid diagram based on the specified diagram type.
   * 
   * @private
   * @async
   * @param {any} args - The arguments for the tool call
   * @param {string} args.repoUrl - The URL of the GitHub repository
   * @param {string} args.diagramType - The type of diagram to generate
   * @returns {Promise<object>} A promise that resolves to the tool response
   * @throws {McpError} If the required parameters are missing
   * @throws {Error} If the GitHub repository URL is invalid
   */
  private async handleGenerateDiagramFromGithub(args: any): Promise<object> {
    // Validate that the required arguments are provided
    if (!args.repoUrl || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: repoUrl and diagramType'
      );
    }

    try {
      // Extract the owner and repository name from the GitHub URL
      const [owner, repo] = extractRepoInfoFromUrl(args.repoUrl);
      
      // Fetch repository data and generate a diagram
      const repoData = await fetchRepositoryData(this.axiosInstance, owner, repo);
      const mermaidCode = generateDiagramFromGithub(args.diagramType, owner, repo, repoData);
      
      // Return the generated diagram as Mermaid code
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram for ${owner}/${repo}:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      // If an error occurs during diagram generation, return an error response
      return {
        content: [
          {
            type: 'text',
            text: `Error generating diagram from GitHub: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Handle the list_supported_diagram_types tool request.
   * 
   * This method returns a list of all diagram types supported by the server,
   * along with a brief description of each type.
   * 
   * @private
   * @returns {object} The tool response containing the list of supported diagram types
   */
  private handleListSupportedDiagramTypes(): object {
    return {
      content: [
        {
          type: 'text',
          text: `
# Supported Diagram Types

1. **flowchart** - Flowcharts for visualizing processes and workflows
2. **sequenceDiagram** - Sequence diagrams for showing interactions between components
3. **classDiagram** - Class diagrams for showing object-oriented structures
4. **stateDiagram** - State diagrams for showing state transitions
5. **entityRelationshipDiagram** - ER diagrams for database schema visualization
6. **userJourney** - User journey diagrams for mapping user experiences
7. **gantt** - Gantt charts for project planning and scheduling
8. **pieChart** - Pie charts for showing proportions
9. **quadrantChart** - Quadrant charts for categorizing items
10. **requirementDiagram** - Requirement diagrams for software requirements
11. **gitGraph** - Git graphs for visualizing Git workflows
12. **c4Diagram** - C4 diagrams for software architecture visualization
          `,
        },
      ],
    };
  }

  /**
   * Run the MCP server.
   * 
   * This method connects the server to a transport (in this case, stdio)
   * and starts listening for requests.
   * 
   * @async
   * @returns {Promise<void>} A promise that resolves when the server is running
   */
  async run(): Promise<void> {
    // Create a stdio transport for the server
    // This allows the server to communicate with the client via standard input/output
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await this.server.connect(transport);
    
    // Log a message to indicate that the server is running
    console.error('Archy MCP server running on stdio');
  }
}