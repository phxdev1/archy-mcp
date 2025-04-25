/**
 * LangChain Chains for Diagram Generation
 * 
 * This file contains the implementation of LangChain chains for generating
 * diagrams from text descriptions and other sources.
 */

import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { createChatModel } from "./config.js";

/**
 * Parser for structured Mermaid diagram output
 * This ensures the model returns a properly formatted Mermaid diagram
 */
const diagramOutputParser = StructuredOutputParser.fromZodSchema(
  z.object({
    mermaidCode: z.string().describe("The Mermaid syntax code for the diagram"),
    explanation: z.string().describe("A brief explanation of the diagram"),
  })
);

/**
 * Format instructions for the output parser
 */
const formatInstructions = diagramOutputParser.getFormatInstructions();

/**
 * Prompt template for generating diagrams from text descriptions
 */
const textToDiagramPromptTemplate = new PromptTemplate({
  template: `You are an expert in creating Mermaid diagrams from text descriptions.
  
Your task is to generate a {diagramType} diagram based on the following description:

{description}

Guidelines for creating the diagram:
- Focus on clarity and simplicity
- Include only the most important elements
- Use proper Mermaid syntax for {diagramType}
- Ensure the diagram is well-structured and easy to understand
- Add appropriate labels and relationships

{format_instructions}`,
  inputVariables: ["description", "diagramType"],
  partialVariables: { format_instructions: formatInstructions },
});

/**
 * Prompt template for generating diagrams from code
 */
const codeToDiagramPromptTemplate = new PromptTemplate({
  template: `You are an expert in analyzing code and creating Mermaid diagrams.
  
Your task is to generate a {diagramType} diagram based on the following code:

{code}

Guidelines for creating the diagram:
- Focus on the structure and relationships in the code
- Include classes, functions, and important variables
- Use proper Mermaid syntax for {diagramType}
- Ensure the diagram accurately represents the code structure
- Add appropriate labels and relationships

{format_instructions}`,
  inputVariables: ["code", "diagramType"],
  partialVariables: { format_instructions: formatInstructions },
});

/**
 * Generate a diagram from a text description
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} description - The text description to generate a diagram from
 * @param {boolean} useAdvancedModel - Whether to use the advanced model
 * @returns {Promise<{mermaidCode: string, explanation: string}>} The generated diagram and explanation
 */
export async function generateDiagramFromTextWithLangChain(
  diagramType: string,
  description: string,
  useAdvancedModel: boolean = false
): Promise<{ mermaidCode: string; explanation: string }> {
  // Create the model based on complexity
  const model = createChatModel(useAdvancedModel ? "ADVANCED" : "DEFAULT");
  
  // Create the chain
  const chain = new LLMChain({
    llm: model,
    prompt: textToDiagramPromptTemplate,
    outputParser: diagramOutputParser,
  });
  
  // Run the chain
  const result = await chain.call({
    description,
    diagramType,
  });
  
  // Parse the output
  return result.text as unknown as { mermaidCode: string; explanation: string };
}

/**
 * Generate a diagram from code
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} code - The code to generate a diagram from
 * @returns {Promise<{mermaidCode: string, explanation: string}>} The generated diagram and explanation
 */
export async function generateDiagramFromCodeWithLangChain(
  diagramType: string,
  code: string
): Promise<{ mermaidCode: string; explanation: string }> {
  // Create the model for code analysis
  const model = createChatModel("CODE_ANALYSIS");
  
  // Create the chain
  const chain = new LLMChain({
    llm: model,
    prompt: codeToDiagramPromptTemplate,
    outputParser: diagramOutputParser,
  });
  
  // Run the chain
  const result = await chain.call({
    code,
    diagramType,
  });
  
  // Parse the output
  return result.text as unknown as { mermaidCode: string; explanation: string };
}

/**
 * Generate a diagram showing the differences between two versions
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} beforeCode - The code before changes
 * @param {string} afterCode - The code after changes
 * @returns {Promise<{mermaidCode: string, explanation: string}>} The generated diagram and explanation
 */
export async function generateDiffDiagramWithLangChain(
  diagramType: string,
  beforeCode: string,
  afterCode: string
): Promise<{ mermaidCode: string; explanation: string }> {
  // Create the model for code analysis
  const model = createChatModel("CODE_ANALYSIS");
  
  // Create a custom prompt for diff visualization
  const diffPromptTemplate = new PromptTemplate({
    template: `You are an expert in visualizing code changes using Mermaid diagrams.
    
Your task is to generate a {diagramType} diagram that shows the differences between the before and after versions of the code.

BEFORE CODE:
{beforeCode}

AFTER CODE:
{afterCode}

Guidelines for creating the diagram:
- Focus on structural changes between the versions
- Highlight added, modified, and removed components
- Use color coding to indicate changes (green for additions, yellow for modifications, red for removals)
- Use proper Mermaid syntax for {diagramType}
- Ensure the diagram clearly shows the evolution of the code

{format_instructions}`,
    inputVariables: ["diagramType", "beforeCode", "afterCode"],
    partialVariables: { format_instructions: formatInstructions },
  });
  
  // Create the chain
  const chain = new LLMChain({
    llm: model,
    prompt: diffPromptTemplate,
    outputParser: diagramOutputParser,
  });
  
  // Run the chain
  const result = await chain.call({
    diagramType,
    beforeCode,
    afterCode,
  });
  
  // Parse the output
  return result.text as unknown as { mermaidCode: string; explanation: string };
}

/**
 * Fix invalid Mermaid syntax using AI
 *
 * @param {string} invalidMermaidCode - The invalid Mermaid code to fix
 * @param {string} diagramType - The type of diagram
 * @param {string} errorMessage - The error message from the validator
 * @param {string} originalDescription - The original description or context for the diagram
 * @returns {Promise<{mermaidCode: string, explanation: string}>} The fixed diagram and explanation
 */
export async function fixMermaidSyntaxWithLangChain(
  invalidMermaidCode: string,
  diagramType: string,
  errorMessage: string,
  originalDescription: string = ""
): Promise<{ mermaidCode: string; explanation: string }> {
  // Create the model for syntax fixing
  const model = createChatModel("CODE_ANALYSIS");
  
  // Create a custom prompt for fixing Mermaid syntax
  const fixSyntaxPromptTemplate = new PromptTemplate({
    template: `You are an expert in Mermaid diagram syntax.

Your task is to fix the syntax errors in the following {diagramType} diagram:

\`\`\`mermaid
{invalidMermaidCode}
\`\`\`

The validator reported the following error:
{errorMessage}

Original description/context for this diagram:
{originalDescription}

Guidelines for fixing the diagram:
- Maintain the original intent and structure of the diagram
- Fix all syntax errors according to the Mermaid specification
- Ensure the diagram is valid and can be rendered correctly
- Make minimal changes to preserve the original content
- If the diagram type is missing or incorrect, add or fix it
- Ensure proper indentation and formatting

{format_instructions}`,
    inputVariables: ["invalidMermaidCode", "diagramType", "errorMessage"],
    partialVariables: { format_instructions: formatInstructions },
  });
  
  // Create the chain
  const chain = new LLMChain({
    llm: model,
    prompt: fixSyntaxPromptTemplate,
    outputParser: diagramOutputParser,
  });
  
  // Run the chain
  const result = await chain.call({
    invalidMermaidCode,
    diagramType,
    errorMessage,
    originalDescription,
  });
  
  // Parse the output
  return result.text as unknown as { mermaidCode: string; explanation: string };
}