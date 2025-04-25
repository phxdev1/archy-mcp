/**
 * Image Export Utility
 * 
 * This file contains utility functions for exporting Mermaid diagrams to various
 * image formats using Puppeteer for rendering.
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Supported image formats
export type ImageFormat = 'png' | 'svg' | 'pdf';

/**
 * Options for exporting a diagram to an image
 */
export interface ExportOptions {
  format: ImageFormat;
  width?: number;
  height?: number;
  backgroundColor?: string;
  outputPath?: string; // If not provided, returns the image as a Buffer
}

/**
 * Export a Mermaid diagram to an image
 * 
 * @param {string} mermaidCode - The Mermaid diagram code
 * @param {ExportOptions} options - Export options
 * @returns {Promise<Buffer|string>} The image buffer or the path to the saved file
 */
export async function exportDiagramToImage(
  mermaidCode: string,
  options: ExportOptions
): Promise<Buffer | string> {
  const {
    format = 'png',
    width = 800,
    height = 600,
    backgroundColor = '#ffffff',
    outputPath
  } = options;

  // Create a temporary HTML file with the Mermaid diagram
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'archy-'));
  const htmlPath = path.join(tempDir, 'diagram.html');
  
  // Create HTML content with Mermaid
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Mermaid Diagram</title>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <style>
        body {
          background-color: ${backgroundColor};
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
        }
        #diagram {
          max-width: 100%;
        }
      </style>
    </head>
    <body>
      <div id="diagram" class="mermaid">
        ${mermaidCode}
      </div>
      <script>
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose'
        });
      </script>
    </body>
    </html>
  `;
  
  await fs.writeFile(htmlPath, htmlContent, 'utf8');
  
  // Launch Puppeteer and render the diagram
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Wait for Mermaid to render
    await page.waitForSelector('.mermaid svg');
    
    // Get the diagram element
    const diagramElement = await page.$('#diagram');
    if (!diagramElement) {
      throw new Error('Diagram element not found');
    }
    
    let result: Buffer | string;
    
    // Export in the requested format
    switch (format) {
      case 'svg':
        // Get the SVG content
        const svgContent = await page.evaluate(() => {
          const svgElement = document.querySelector('.mermaid svg');
          return svgElement ? svgElement.outerHTML : '';
        });
        
        if (!svgContent) {
          throw new Error('SVG content not found');
        }
        
        if (outputPath) {
          await fs.writeFile(outputPath, svgContent, 'utf8');
          result = outputPath;
        } else {
          result = Buffer.from(svgContent, 'utf8');
        }
        break;
        
      case 'pdf':
        if (outputPath) {
          await page.pdf({
            path: outputPath,
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
          });
          result = outputPath;
        } else {
          const pdfBuffer = await page.pdf({
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
          });
          result = pdfBuffer;
        }
        break;
        
      case 'png':
      default:
        if (outputPath) {
          await diagramElement.screenshot({
            path: outputPath,
            omitBackground: backgroundColor === 'transparent'
          });
          result = outputPath;
        } else {
          const pngBuffer = await diagramElement.screenshot({
            omitBackground: backgroundColor === 'transparent'
          });
          result = pngBuffer;
        }
        break;
    }
    
    return result;
  } finally {
    await browser.close();
    
    // Clean up temporary files
    try {
      await fs.unlink(htmlPath);
      await fs.rmdir(tempDir);
    } catch (error) {
      console.warn('Error cleaning up temporary files:', error);
    }
  }
}

/**
 * Export a Mermaid diagram to a data URL
 * 
 * @param {string} mermaidCode - The Mermaid diagram code
 * @param {Omit<ExportOptions, 'outputPath'>} options - Export options
 * @returns {Promise<string>} The data URL
 */
export async function exportDiagramToDataUrl(
  mermaidCode: string,
  options: Omit<ExportOptions, 'outputPath'>
): Promise<string> {
  const buffer = await exportDiagramToImage(mermaidCode, options) as Buffer;
  
  // Convert the buffer to a data URL
  const mimeType = options.format === 'svg' ? 'image/svg+xml' :
                   options.format === 'pdf' ? 'application/pdf' :
                   'image/png';
  
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * In-memory export of a Mermaid diagram to an image
 * This function doesn't write any files to disk
 * 
 * @param {string} mermaidCode - The Mermaid diagram code
 * @param {Omit<ExportOptions, 'outputPath'>} options - Export options
 * @returns {Promise<Buffer>} The image buffer
 */
export async function exportDiagramInMemory(
  mermaidCode: string,
  options: Omit<ExportOptions, 'outputPath'>
): Promise<Buffer> {
  // Create a browser instance
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const { width = 800, height = 600, backgroundColor = '#ffffff' } = options;
    
    await page.setViewport({ width, height });
    
    // Set content directly without creating a file
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mermaid Diagram</title>
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        <style>
          body {
            background-color: ${backgroundColor};
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
          }
          #diagram {
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <div id="diagram" class="mermaid">
          ${mermaidCode}
        </div>
        <script>
          mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose'
          });
        </script>
      </body>
      </html>
    `);
    
    // Wait for Mermaid to render
    await page.waitForSelector('.mermaid svg');
    
    // Get the diagram element
    const diagramElement = await page.$('#diagram');
    if (!diagramElement) {
      throw new Error('Diagram element not found');
    }
    
    let result: Buffer;
    
    // Export in the requested format
    switch (options.format) {
      case 'svg':
        // Get the SVG content
        const svgContent = await page.evaluate(() => {
          const svgElement = document.querySelector('.mermaid svg');
          return svgElement ? svgElement.outerHTML : '';
        });
        
        if (!svgContent) {
          throw new Error('SVG content not found');
        }
        
        result = Buffer.from(svgContent, 'utf8');
        break;
        
      case 'pdf':
        result = await page.pdf({
          printBackground: true,
          margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        break;
        
      case 'png':
      default:
        result = await diagramElement.screenshot({
          omitBackground: backgroundColor === 'transparent'
        }) as Buffer;
        break;
    }
    
    return result;
  } finally {
    await browser.close();
  }
}