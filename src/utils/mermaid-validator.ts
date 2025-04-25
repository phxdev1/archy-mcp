/**
 * Mermaid Validator Utility
 * 
 * This file contains utility functions for validating Mermaid diagram syntax.
 * It uses Puppeteer to check if the Mermaid diagram can be rendered correctly.
 */

import puppeteer from 'puppeteer';
import { fixMermaidSyntaxWithAI } from '../generators/langchain-generator.js';
import { isApiConfigured } from '../langchain/config.js';

/**
 * Error details returned by the validator
 */
export interface MermaidValidationError {
  message: string;
  line?: number;
  column?: number;
  details?: string;
}

/**
 * Validation result
 */
export interface MermaidValidationResult {
  isValid: boolean;
  error?: MermaidValidationError;
}

/**
 * Validates Mermaid diagram syntax
 * 
 * @param mermaidCode - The Mermaid diagram code to validate
 * @returns A promise that resolves to the validation result
 */
export async function validateMermaidSyntax(mermaidCode: string): Promise<MermaidValidationResult> {
  let browser;
  try {
    // Launch a headless browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create a new page
    const page = await browser.newPage();

    // Create a simple HTML page with Mermaid
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
          <script>
            mermaid.initialize({
              startOnLoad: false,
              securityLevel: 'loose'
            });
          </script>
        </head>
        <body>
          <div id="diagram"></div>
          <script>
            function validateMermaid() {
              try {
                const result = mermaid.parse(\`${mermaidCode.replace(/`/g, '\\`')}\`);
                return { isValid: true };
              } catch (error) {
                return { 
                  isValid: false, 
                  error: {
                    message: error.message,
                    line: error.hash?.line,
                    column: error.hash?.column,
                    details: error.str || error.toString()
                  }
                };
              }
            }
          </script>
        </body>
      </html>
    `;

    // Set the page content
    await page.setContent(html);

    // Evaluate the validation function
    const result = await page.evaluate(() => {
      // @ts-ignore - validateMermaid is defined in the page context
      return validateMermaid();
    });

    return result as MermaidValidationResult;
  } catch (error) {
    // If there's an error with Puppeteer, return a generic error
    return {
      isValid: false,
      error: {
        message: `Error validating Mermaid syntax: ${(error as Error).message}`
      }
    };
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Validates and fixes Mermaid syntax issues
 *
 * @param mermaidCode - The Mermaid diagram code to validate and fix
 * @param diagramType - The type of diagram (flowchart, sequenceDiagram, etc.)
 * @param originalDescription - The original description or context for the diagram
 * @returns A promise that resolves to the fixed Mermaid code or the original if no fixes were needed
 */
export async function validateAndFixMermaidSyntax(
  mermaidCode: string,
  diagramType: string = "",
  originalDescription: string = ""
): Promise<string> {
  // First, validate the original code
  const validationResult = await validateMermaidSyntax(mermaidCode);
  
  // If it's valid, return the original code
  if (validationResult.isValid) {
    return mermaidCode;
  }
  
  // Try to use AI to fix the syntax if OpenRouter API is configured
  if (isApiConfigured()) {
    try {
      console.log("Attempting to fix Mermaid syntax with AI...");
      const errorMessage = validationResult.error?.message || "Unknown syntax error";
      
      // Infer diagram type if not provided
      let inferredDiagramType = diagramType;
      if (!inferredDiagramType) {
        if (mermaidCode.match(/^(flowchart|sequenceDiagram|classDiagram|stateDiagram|entityRelationshipDiagram|userJourney|gantt|pieChart|quadrantChart|requirementDiagram|gitGraph|c4Diagram)/)) {
          // Extract the diagram type from the code
          inferredDiagramType = mermaidCode.split(/\s+/)[0];
        } else if (mermaidCode.includes('-->') || mermaidCode.includes('-->')) {
          inferredDiagramType = 'flowchart';
        } else if (mermaidCode.includes('class ')) {
          inferredDiagramType = 'classDiagram';
        } else if (mermaidCode.includes('participant ') || mermaidCode.includes('actor ')) {
          inferredDiagramType = 'sequenceDiagram';
        } else if (mermaidCode.includes('state ')) {
          inferredDiagramType = 'stateDiagram';
        } else {
          inferredDiagramType = 'flowchart';
        }
      }
      
      // Use AI to fix the syntax
      const aiFixedCode = await fixMermaidSyntaxWithAI(
        mermaidCode,
        inferredDiagramType,
        errorMessage,
        originalDescription
      );
      
      // Validate the AI-fixed code
      const aiFixedValidationResult = await validateMermaidSyntax(aiFixedCode);
      
      // If AI fixed it successfully, return the fixed code
      if (aiFixedValidationResult.isValid) {
        return aiFixedCode;
      }
      
      // If AI couldn't fix it, fall back to rule-based fixes
      console.log("AI couldn't fix the syntax, falling back to rule-based fixes...");
    } catch (error) {
      console.error("Error using AI to fix Mermaid syntax:", error);
      // Fall back to rule-based fixes
    }
  }
  
  // Fall back to rule-based fixes
  let fixedCode = mermaidCode;
  
  // Fix 1: Add missing diagram type at the beginning
  if (!fixedCode.match(/^(flowchart|sequenceDiagram|classDiagram|stateDiagram|entityRelationshipDiagram|userJourney|gantt|pieChart|quadrantChart|requirementDiagram|gitGraph|c4Diagram)/)) {
    // Try to infer the diagram type from the content
    if (fixedCode.includes('-->') || fixedCode.includes('-->')) {
      fixedCode = `flowchart TD\n${fixedCode}`;
    } else if (fixedCode.includes('class ')) {
      fixedCode = `classDiagram\n${fixedCode}`;
    } else if (fixedCode.includes('participant ') || fixedCode.includes('actor ')) {
      fixedCode = `sequenceDiagram\n${fixedCode}`;
    } else if (fixedCode.includes('state ')) {
      fixedCode = `stateDiagram-v2\n${fixedCode}`;
    } else {
      // Default to flowchart if we can't infer the type
      fixedCode = `flowchart TD\n${fixedCode}`;
    }
  }
  
  // Fix 2: Fix common syntax errors
  // Replace double quotes with single quotes in node IDs
  fixedCode = fixedCode.replace(/(\w+)\s*\[\s*"([^"]+)"\s*\]/g, '$1["$2"]');
  
  // Fix 3: Add missing end statements
  if (fixedCode.includes('subgraph') && !fixedCode.includes('end')) {
    fixedCode += '\nend';
  }
  
  // Validate the fixed code
  const fixedValidationResult = await validateMermaidSyntax(fixedCode);
  
  // Return the fixed code if it's valid, otherwise return the original
  return fixedValidationResult.isValid ? fixedCode : mermaidCode;
}