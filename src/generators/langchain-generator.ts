/**
 * LangChain-based Diagram Generator
 * 
 * This file contains functions for generating Mermaid diagrams using LangChain
 * and OpenRouter. It integrates with the existing generator system while
 * providing enhanced capabilities through AI models.
 */

import { isApiConfigured } from '../langchain/config.js';
import {
  generateDiagramFromTextWithLangChain,
  generateDiagramFromCodeWithLangChain,
  generateDiffDiagramWithLangChain,
  fixMermaidSyntaxWithLangChain
} from '../langchain/chains.js';
import { generateDiagramFromText } from './text-generator.js';

/**
 * Generate a diagram from a text description using LangChain.
 * Falls back to the standard text generator if LangChain is not configured.
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} description - The text description to analyze
 * @param {boolean} useAdvancedModel - Whether to use the advanced model
 * @returns {Promise<string>} The Mermaid syntax code for the diagram
 */
export async function generateDiagramFromTextWithAI(
  diagramType: string,
  description: string,
  useAdvancedModel: boolean = false
): Promise<string> {
  // Check if the API is configured
  if (!isApiConfigured()) {
    console.warn('OpenRouter API key not configured. Falling back to standard generator.');
    return generateDiagramFromText(diagramType, description);
  }

  try {
    // Generate the diagram using LangChain
    const result = await generateDiagramFromTextWithLangChain(
      diagramType,
      description,
      useAdvancedModel
    );
    
    return result.mermaidCode;
  } catch (error) {
    console.error('Error generating diagram with LangChain:', error);
    // Fall back to the standard generator
    return generateDiagramFromText(diagramType, description);
  }
}

/**
 * Generate a diagram from code using LangChain.
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} code - The code to analyze
 * @returns {Promise<string>} The Mermaid syntax code for the diagram
 * @throws {Error} If the API is not configured
 */
export async function generateDiagramFromCode(
  diagramType: string,
  code: string
): Promise<string> {
  // Check if the API is configured
  if (!isApiConfigured()) {
    throw new Error('OpenRouter API key not configured. Cannot generate diagram from code.');
  }

  // Generate the diagram using LangChain
  const result = await generateDiagramFromCodeWithLangChain(diagramType, code);
  return result.mermaidCode;
}

/**
 * Generate a diagram showing the differences between two versions of code.
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} beforeCode - The code before changes
 * @param {string} afterCode - The code after changes
 * @returns {Promise<string>} The Mermaid syntax code for the diagram
 * @throws {Error} If the API is not configured
 */
export async function generateDiffDiagram(
  diagramType: string,
  beforeCode: string,
  afterCode: string
): Promise<string> {
  // Check if the API is configured
  if (!isApiConfigured()) {
    throw new Error('OpenRouter API key not configured. Cannot generate diff diagram.');
  }

  // Generate the diagram using LangChain
  const result = await generateDiffDiagramWithLangChain(diagramType, beforeCode, afterCode);
  return result.mermaidCode;
}
/**
 * Generate a diagram from a local code repository.
 *
 * This is a placeholder for future implementation.
 * It would require file system access to read the repository files.
 */
export async function generateDiagramFromLocalRepo(
  diagramType: string,
  repoPath: string,
  filePatterns: string[] = ['**/*.ts', '**/*.js']
): Promise<string> {
  throw new Error('Local repository analysis not yet implemented.');
}

/**
 * Generate a diagram showing the evolution of a repository over time.
 *
 * This is a placeholder for future implementation.
 * It would require git integration to analyze repository history.
 */
export async function generateEvolutionDiagram(
  diagramType: string,
  repoPath: string,
  commitLimit: number = 10
): Promise<string> {
  throw new Error('Repository evolution analysis not yet implemented.');
}

/**
 * Fix invalid Mermaid syntax using AI
 *
 * @param {string} invalidMermaidCode - The invalid Mermaid code to fix
 * @param {string} diagramType - The type of diagram
 * @param {string} errorMessage - The error message from the validator
 * @param {string} originalDescription - The original description or context for the diagram
 * @returns {Promise<string>} The fixed Mermaid syntax code
 * @throws {Error} If the API is not configured
 */
export async function fixMermaidSyntaxWithAI(
  invalidMermaidCode: string,
  diagramType: string,
  errorMessage: string,
  originalDescription: string = ""
): Promise<string> {
  // Check if the API is configured
  if (!isApiConfigured()) {
    throw new Error('OpenRouter API key not configured. Cannot fix Mermaid syntax with AI.');
  }

  try {
    // Fix the Mermaid syntax using LangChain
    const result = await fixMermaidSyntaxWithLangChain(
      invalidMermaidCode,
      diagramType,
      errorMessage,
      originalDescription
    );
    
    return result.mermaidCode;
  } catch (error) {
    console.error('Error fixing Mermaid syntax with AI:', error);
    // Return the original code if there's an error
    return invalidMermaidCode;
  }
}