import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AxiosInstance } from 'axios';

/**
 * Interface for the ArchyServer class
 */
export interface IArchyServer {
  server: Server;
  axiosInstance: AxiosInstance;

  setupToolHandlers(): void;
  handleGenerateDiagramFromText(args: any): Promise<object>;
  handleGenerateDiagramFromGithub(args: any): Promise<object>;
  handleListSupportedDiagramTypes(): object;
  handleGenerateDiagramFromTextWithAI(args: any): Promise<object>;
  handleGenerateDiagramFromCode(args: any): Promise<object>;
  handleGenerateDiffDiagram(args: any): Promise<object>;
  handleExportDiagramToImage(args: any): Promise<object>;
  handleGenerateRepositoryEvolutionDiagram(args: any): Promise<object>;
  run(): Promise<void>;
}