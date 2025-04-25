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
import {
  generateDiagramFromTextWithAI,
  generateDiagramFromCode,
  generateDiffDiagram
} from './generators/langchain-generator.js';
import { isApiConfigured } from './langchain/config.js';
import { exportDiagramInMemory, exportDiagramToDataUrl, ImageFormat } from './utils/image-exporter.js';
import { InMemoryGit } from './utils/git-memory.js';
import { validateMermaidSyntax, validateAndFixMermaidSyntax } from './utils/mermaid-validator.js';
import { addColorContrastDirective, applyAllStylingDirectives } from './utils/mermaid-styler.js';

// Define a generic type for all tool arguments
type ToolArguments = Record<string, any>;

/**
 * Archy MCP Server class
 */
export class ArchyServer {
  server: Server;
  axiosInstance: AxiosInstance;

  constructor(githubToken?: string) {
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

    this.axiosInstance = createGitHubApiClient(githubToken);
    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    const diagramTypes = [
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
    ];

    const tools = [
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
              enum: diagramTypes
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
              enum: diagramTypes
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
      }
    ];

    if (isApiConfigured()) {
      tools.push(
        {
          name: 'generate_diagram_from_text_with_ai',
          description: 'Generate a Mermaid diagram from a text description using AI (LangChain with OpenRouter)',
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
                enum: diagramTypes
              }
            },
            required: ['description', 'diagramType'],
          },
        },
        {
          name: 'generate_diagram_from_code',
          description: 'Generate a Mermaid diagram from code using AI',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The code to analyze and generate a diagram from',
              },
              diagramType: {
                type: 'string',
                description: 'Type of diagram to generate (flowchart, class, sequence, etc.)',
                enum: diagramTypes
              }
            },
            required: ['code', 'diagramType']
          } as any,
        },
        {
          name: 'generate_diff_diagram',
          description: 'Generate a Mermaid diagram showing differences between two versions of code',
          inputSchema: {
            type: 'object',
            properties: {
              beforeCode: {
                type: 'string',
                description: 'The code before changes',
              },
              afterCode: {
                type: 'string',
                description: 'The code after changes',
              },
              diagramType: {
                type: 'string',
                description: 'Type of diagram to generate (flowchart, class, sequence, etc.)',
                enum: diagramTypes
              }
            },
            required: ['beforeCode', 'afterCode', 'diagramType'],
          } as any,
        },
        {
          name: 'export_diagram_to_image',
          description: 'Export a Mermaid diagram to an image format (PNG, SVG, or PDF)',
          inputSchema: {
            type: 'object',
            properties: {
              mermaidCode: {
                type: 'string',
                description: 'The Mermaid diagram code to export',
              },
              format: {
                type: 'string',
                description: 'The image format to export to',
                enum: ['png', 'svg', 'pdf'],
                default: 'png'
              },
              width: {
                type: 'number',
                description: 'The width of the image in pixels',
                default: 800
              },
              height: {
                type: 'number',
                description: 'The height of the image in pixels',
                default: 600
              },
              backgroundColor: {
                type: 'string',
                description: 'The background color of the image (CSS color or "transparent")',
                default: '#ffffff'
              }
            },
            required: ['mermaidCode'],
          } as any,
        },
        {
          name: 'generate_repository_evolution_diagram',
          description: 'Generate a diagram showing the evolution of a repository over time',
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
                enum: diagramTypes
              },
              filepath: {
                type: 'string',
                description: 'Path to a specific file to track (optional)',
              },
              commitLimit: {
                type: 'number',
                description: 'Maximum number of commits to analyze',
                default: 10
              }
            },
            required: ['repoUrl', 'diagramType'],
          } as any,
        }
      );
    }

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'generate_diagram_from_text':
          return this.handleGenerateDiagramFromText(request.params.arguments);
        
        case 'generate_diagram_from_github':
          return this.handleGenerateDiagramFromGithub(request.params.arguments);
        
        case 'list_supported_diagram_types':
          return this.handleListSupportedDiagramTypes();
        
        case 'generate_diagram_from_text_with_ai':
          return this.handleGenerateDiagramFromTextWithAI(request.params.arguments);
        
        case 'generate_diagram_from_code':
          return this.handleGenerateDiagramFromCode(request.params.arguments);
        
        case 'generate_diff_diagram':
          return this.handleGenerateDiffDiagram(request.params.arguments);
        
        case 'export_diagram_to_image':
          return this.handleExportDiagramToImage(request.params.arguments);
        
        case 'generate_repository_evolution_diagram':
          return this.handleGenerateRepositoryEvolutionDiagram(request.params.arguments);
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async handleGenerateDiagramFromText(args: ToolArguments): Promise<object> {
    if (!args.description || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: description and diagramType'
      );
    }
try {
  let mermaidCode = generateDiagramFromText(args.diagramType, args.description);
  
  // Validate and fix the Mermaid syntax
  const validationResult = await validateMermaidSyntax(mermaidCode);
  if (!validationResult.isValid) {
    console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
    // Try to fix the syntax, passing the original description for context
    mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, args.description);
  }
  
  // Apply all styling directives for maximum visibility and clean layout
  mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram from text description with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
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

  async handleGenerateDiagramFromGithub(args: ToolArguments): Promise<object> {
    if (!args.repoUrl || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: repoUrl and diagramType'
      );
    }

    try {
      const [owner, repo] = extractRepoInfoFromUrl(args.repoUrl);
      
      const repoData = await fetchRepositoryData(this.axiosInstance, owner, repo);
      let mermaidCode = generateDiagramFromGithub(args.diagramType, owner, repo, repoData);
      
      // Validate and fix the Mermaid syntax
      const validationResult = await validateMermaidSyntax(mermaidCode);
      if (!validationResult.isValid) {
        console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
        // Try to fix the syntax, passing repository info for context
        const repoContext = `GitHub repository: ${owner}/${repo}`;
        mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, repoContext);
      }
      
      // Apply all styling directives for maximum visibility and clean layout
      mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram for ${owner}/${repo} with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
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

  handleListSupportedDiagramTypes(): object {
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

  async handleGenerateDiagramFromTextWithAI(args: ToolArguments): Promise<object> {
    if (!args.description || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: description and diagramType'
      );
    }

    try {
      if (!isApiConfigured()) {
        throw new Error('OpenRouter API key not configured. Cannot use AI-powered diagram generation.');
      }

      let mermaidCode = await generateDiagramFromTextWithAI(
        args.diagramType,
        args.description,
        args.useAdvancedModel || false
      );
      
      // Validate and fix the Mermaid syntax
      const validationResult = await validateMermaidSyntax(mermaidCode);
      if (!validationResult.isValid) {
        console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
        // Try to fix the syntax, passing the original description for context
        mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, args.description);
      }
      
      // Apply all styling directives for maximum visibility and clean layout
      mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram from text description using AI with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating diagram with AI: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleGenerateDiagramFromCode(args: ToolArguments): Promise<object> {
    if (!args.code || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: code and diagramType'
      );
    }

    try {
      if (!isApiConfigured()) {
        throw new Error('OpenRouter API key not configured. Cannot use AI-powered code analysis.');
      }

      let mermaidCode = await generateDiagramFromCode(args.diagramType, args.code);
      
      // Validate and fix the Mermaid syntax
      const validationResult = await validateMermaidSyntax(mermaidCode);
      if (!validationResult.isValid) {
        console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
        // Try to fix the syntax, passing the original code for context
        mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, `Code context: ${args.code.substring(0, 200)}...`);
      }
      
      // Apply all styling directives for maximum visibility and clean layout
      mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram from code with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating diagram from code: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleGenerateDiffDiagram(args: ToolArguments): Promise<object> {
    if (!args.beforeCode || !args.afterCode || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: beforeCode, afterCode, and diagramType'
      );
    }

    try {
      if (!isApiConfigured()) {
        throw new Error('OpenRouter API key not configured. Cannot use AI-powered diff visualization.');
      }

      let mermaidCode = await generateDiffDiagram(
        args.diagramType,
        args.beforeCode,
        args.afterCode
      );
      
      // Validate and fix the Mermaid syntax
      const validationResult = await validateMermaidSyntax(mermaidCode);
      if (!validationResult.isValid) {
        console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
        // Try to fix the syntax, passing diff context
        const diffContext = `Diff diagram showing changes between code versions`;
        mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, diffContext);
      }
      
      // Apply all styling directives for maximum visibility and clean layout
      mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram showing code differences with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating diff diagram: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleExportDiagramToImage(args: ToolArguments): Promise<object> {
    if (!args.mermaidCode) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameter: mermaidCode'
      );
    }

    try {
      const format = (args.format || 'png') as ImageFormat;
      const width = args.width || 800;
      const height = args.height || 600;
      const backgroundColor = args.backgroundColor || '#ffffff';

      // Apply all styling directives for maximum visibility and clean layout
      const mermaidCodeWithStyling = applyAllStylingDirectives(args.mermaidCode);
      
      const dataUrl = await exportDiagramToDataUrl(mermaidCodeWithStyling, {
        format,
        width,
        height,
        backgroundColor
      });

      return {
        content: [
          {
            type: 'text',
            text: `Exported diagram as ${format.toUpperCase()}:`,
          },
          {
            type: 'image',
            url: dataUrl,
            title: `Diagram exported as ${format.toUpperCase()}`
          }
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error exporting diagram to image: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async handleGenerateRepositoryEvolutionDiagram(args: ToolArguments): Promise<object> {
    if (!args.repoUrl || !args.diagramType) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Missing required parameters: repoUrl and diagramType'
      );
    }

    try {
      const [owner, repo] = extractRepoInfoFromUrl(args.repoUrl);
      
      const commitLimit = args.commitLimit || 10;
      
      const git = new InMemoryGit();
      
      await git.clone(args.repoUrl);
      
      const commits = await git.getCommits(commitLimit);
      
      let mermaidCode: string;
      let needsValidation = true;
      
      if (args.filepath) {
        const fileEvolution = await git.getFileEvolution(args.filepath, commitLimit);
        
        if (args.diagramType === 'gitGraph') {
          mermaidCode = `gitGraph
    commit id: "${fileEvolution[0]?.sha?.substring(0, 7) || 'initial'}" tag: "initial"`;
          
          for (let i = 1; i < fileEvolution.length; i++) {
            const commit = fileEvolution[i];
            mermaidCode += `
    commit id: "${commit.sha.substring(0, 7)}" tag: "${i}"`;
          }
        } else {
          if (fileEvolution.length >= 2) {
            const firstVersion = fileEvolution[fileEvolution.length - 1].content;
            const lastVersion = fileEvolution[0].content;
            
            mermaidCode = await generateDiffDiagram(args.diagramType, firstVersion, lastVersion);
          } else if (fileEvolution.length === 1) {
            mermaidCode = await generateDiagramFromCode(args.diagramType, fileEvolution[0].content);
          } else {
            throw new Error(`File ${args.filepath} not found in repository history`);
          }
        }
      } else {
        if (args.diagramType === 'gitGraph') {
          mermaidCode = `gitGraph
    commit id: "${commits[0]?.sha?.substring(0, 7) || 'initial'}" tag: "initial"`;
          
          for (let i = 1; i < commits.length; i++) {
            const commit = commits[i];
            mermaidCode += `
    commit id: "${commit.sha.substring(0, 7)}" tag: "${i}"`;
          }
        } else if (args.diagramType === 'flowchart') {
          mermaidCode = `flowchart TD
    subgraph "Repository Evolution"
    Start([Start]) --> Commit1[Commit: ${commits[commits.length - 1]?.sha?.substring(0, 7) || 'initial'}]`;
          
          for (let i = commits.length - 2; i >= 0; i--) {
            const commit = commits[i];
            const nextCommit = commits[i + 1];
            
            const filesAdded = commit.files.filter(f => f.type === 'add').length;
            const filesModified = commit.files.filter(f => f.type === 'modify').length;
            const filesDeleted = commit.files.filter(f => f.type === 'delete').length;
            
            mermaidCode += `
    Commit${commits.length - i} --> Commit${commits.length - i + 1}[Commit: ${commit.sha.substring(0, 7)}]
    Commit${commits.length - i + 1} -- "+${filesAdded} -${filesDeleted} ~${filesModified}" --> Changes${commits.length - i + 1}[Changes]`;
          }
          
          mermaidCode += `
    Commit${commits.length} --> End([End])
    end`;
        } else {
          mermaidCode = `${args.diagramType}
    note "Repository evolution diagram for ${owner}/${repo} (${args.diagramType})"
    note "This diagram type is not yet fully implemented for repository evolution"`;
        }
      }
      
      // Validate and fix the Mermaid syntax if needed
      if (needsValidation) {
        const validationResult = await validateMermaidSyntax(mermaidCode);
        if (!validationResult.isValid) {
          console.warn(`Mermaid syntax validation failed: ${validationResult.error?.message}`);
          // Try to fix the syntax, passing repository info for context
          const repoContext = `Repository evolution diagram for ${owner}/${repo}${args.filepath ? ` (file: ${args.filepath})` : ''}`;
          mermaidCode = await validateAndFixMermaidSyntax(mermaidCode, args.diagramType, repoContext);
        }
      }
      
      // Apply all styling directives for maximum visibility and clean layout
      mermaidCode = applyAllStylingDirectives(mermaidCode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Generated ${args.diagramType} diagram showing evolution of ${owner}/${repo}${args.filepath ? ` (file: ${args.filepath})` : ''} with clean layout and optimal readability:\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error generating repository evolution diagram: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Archy MCP server running on stdio');
  }
}