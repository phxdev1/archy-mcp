/**
 * Image Export and Repository Evolution Example
 * 
 * This example demonstrates how to use the image export and repository evolution
 * tracking features of Archy.
 * 
 * To run this example:
 * 1. Build the project: npm run build
 * 2. Run: node examples/image-export-and-evolution.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportDiagramInMemory, exportDiagramToDataUrl } from '../build/utils/image-exporter.js';
import { InMemoryGit } from '../build/utils/git-memory.js';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example 1: Export a diagram to an image
async function exportDiagramExample() {
  console.log('Example 1: Export a diagram to an image');
  
  // Create a simple flowchart
  const mermaidCode = `
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    C --> E[Deploy]
    D --> B
    E --> F[End]
  `;
  
  try {
    // Export the diagram to PNG
    console.log('Exporting diagram to PNG...');
    const pngBuffer = await exportDiagramInMemory(mermaidCode, {
      format: 'png',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });
    
    // Save the PNG to a file
    const pngPath = path.join(__dirname, 'diagram.png');
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`PNG saved to: ${pngPath}`);
    
    // Export the diagram to SVG
    console.log('Exporting diagram to SVG...');
    const svgBuffer = await exportDiagramInMemory(mermaidCode, {
      format: 'svg',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });
    
    // Save the SVG to a file
    const svgPath = path.join(__dirname, 'diagram.svg');
    fs.writeFileSync(svgPath, svgBuffer);
    console.log(`SVG saved to: ${svgPath}`);
    
    // Export the diagram to a data URL
    console.log('Exporting diagram to data URL...');
    const dataUrl = await exportDiagramToDataUrl(mermaidCode, {
      format: 'png',
      width: 800,
      height: 600,
      backgroundColor: '#ffffff'
    });
    
    console.log(`Data URL: ${dataUrl.substring(0, 50)}...`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 2: Track repository evolution
async function repositoryEvolutionExample() {
  console.log('\nExample 2: Track repository evolution');
  
  try {
    // Create an in-memory git repository
    const git = new InMemoryGit();
    
    // Clone a repository
    console.log('Cloning repository...');
    const repoUrl = 'https://github.com/mermaid-js/mermaid';
    await git.clone(repoUrl);
    
    // Get the commit history
    console.log('Getting commit history...');
    const commits = await git.getCommits(5); // Limit to 5 commits
    
    console.log('Recent commits:');
    for (const commit of commits) {
      console.log(`- ${commit.sha.substring(0, 7)}: ${commit.message.split('\n')[0]}`);
      console.log(`  Author: ${commit.author.name} <${commit.author.email}>`);
      console.log(`  Files changed: ${commit.files.length}`);
      console.log('');
    }
    
    // Get the evolution of a specific file
    if (commits.length > 0) {
      console.log('Tracking file evolution...');
      const filepath = 'README.md'; // Track the README.md file
      const fileEvolution = await git.getFileEvolution(filepath, 3); // Limit to 3 versions
      
      console.log(`Evolution of ${filepath}:`);
      for (const version of fileEvolution) {
        console.log(`- ${version.sha.substring(0, 7)}: ${version.message.split('\n')[0]}`);
        console.log(`  Content length: ${version.content.length} characters`);
        console.log('');
      }
      
      // Generate a gitGraph diagram showing the evolution
      if (fileEvolution.length > 0) {
        console.log('Generating gitGraph diagram...');
        let mermaidCode = `gitGraph
    commit id: "${fileEvolution[0].sha.substring(0, 7)}" tag: "initial"`;
        
        for (let i = 1; i < fileEvolution.length; i++) {
          const commit = fileEvolution[i];
          mermaidCode += `
    commit id: "${commit.sha.substring(0, 7)}" tag: "${i}"`;
        }
        
        console.log('Mermaid code:');
        console.log('```mermaid');
        console.log(mermaidCode);
        console.log('```');
        
        // Export the diagram to PNG
        console.log('Exporting gitGraph to PNG...');
        const pngBuffer = await exportDiagramInMemory(mermaidCode, {
          format: 'png',
          width: 800,
          height: 400,
          backgroundColor: '#ffffff'
        });
        
        // Save the PNG to a file
        const pngPath = path.join(__dirname, 'git-evolution.png');
        fs.writeFileSync(pngPath, pngBuffer);
        console.log(`Git evolution diagram saved to: ${pngPath}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the examples
(async () => {
  await exportDiagramExample();
  await repositoryEvolutionExample();
  
  console.log('\nExamples completed.');
})();