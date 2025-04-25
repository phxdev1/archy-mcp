import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

export class ArchyServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'archy',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    const tools = [
      {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
              description: 'Test parameter',
            }
          },
          required: ['test'],
        },
      }
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'test_tool':
          return this.handleTestTool(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async handleTestTool(args: any): Promise<object> {
    return {
      content: [
        {
          type: 'text',
          text: `Test tool called with: ${args.test}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Test MCP server running on stdio');
  }
}