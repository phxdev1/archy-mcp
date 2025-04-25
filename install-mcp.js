#!/usr/bin/env node
/**
 * Archy MCP Server Installation Script
 * 
 * This script helps install the Archy MCP server configuration
 * in the appropriate locations for your MCP clients (VS Code and Claude).
 * It also prompts for a GitHub token for repository analysis.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the absolute path to the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const currentDir = process.cwd();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Promisified version of readline question
 * @param {string} question - The question to ask the user
 * @returns {Promise<string>} - The user's response
 */
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Determine the VS Code MCP settings location based on the OS
 * @returns {string} The path to the VS Code MCP settings file
 */
function getVSCodeMcpSettingsPath() {
  const homeDir = os.homedir();
  
  // For Windows
  if (process.platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
  }
  
  // For macOS
  if (process.platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
  }
  
  // For Linux
  return path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'mcp_settings.json');
}

/**
 * Determine the Claude MCP settings location based on the OS
 * @returns {string} The path to the Claude MCP settings file
 */
function getClaudeMcpSettingsPath() {
  const homeDir = os.homedir();
  
  // For Windows
  if (process.platform === 'win32') {
    return path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
  }
  
  // For macOS
  if (process.platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  
  // For Linux
  return path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json');
}

/**
 * Read the Archy MCP configuration
 * @returns {Object} The parsed Archy MCP configuration
 */
function readArchyConfig() {
  const configPath = path.join(currentDir, 'archy-mcp-config.json');
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading Archy MCP configuration:', error.message);
    process.exit(1);
  }
}

/**
 * Update the MCP settings file at the specified path
 * @param {string} mcpSettingsPath - The path to the MCP settings file
 * @param {Object} archyConfig - The Archy MCP configuration
 * @param {string} clientName - The name of the client (VS Code or Claude)
 * @returns {boolean} Whether the update was successful
 */
function updateMcpSettingsFile(mcpSettingsPath, archyConfig, clientName) {
  try {
    // Create the directory if it doesn't exist
    const settingsDir = path.dirname(mcpSettingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }
    
    // Read existing settings if available
    let mcpSettings = { mcpServers: {} };
    if (fs.existsSync(mcpSettingsPath)) {
      const settingsData = fs.readFileSync(mcpSettingsPath, 'utf8');
      try {
        mcpSettings = JSON.parse(settingsData);
        // Ensure mcpServers exists
        if (!mcpSettings.mcpServers) {
          mcpSettings.mcpServers = {};
        }
      } catch (error) {
        console.warn(`Warning: Could not parse existing ${clientName} MCP settings, creating new file.`);
      }
    }
    
    // Merge the Archy configuration with existing settings
    mcpSettings.mcpServers = {
      ...mcpSettings.mcpServers,
      ...archyConfig.mcpServers
    };
    
    // Write the updated settings
    fs.writeFileSync(mcpSettingsPath, JSON.stringify(mcpSettings, null, 2), 'utf8');
    console.log(`Archy MCP server configuration installed for ${clientName} at: ${mcpSettingsPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating ${clientName} MCP settings:`, error.message);
    return false;
  }
}

/**
 * Prompt the user for their GitHub token
 * @returns {Promise<string>} The GitHub token
 */
async function promptForGitHubToken() {
  console.log('\nGitHub Token Configuration');
  console.log('-------------------------');
  console.log('A GitHub token is needed to access GitHub repositories for analysis.');
  console.log('If you don\'t have a token, you can create one at: https://github.com/settings/tokens');
  console.log('The token needs "repo" scope for accessing repositories.');
  console.log('Leave blank if you don\'t want to use GitHub repository analysis.\n');
  
  const token = await promptUser('Enter your GitHub token (or press Enter to skip): ');
  return token.trim();
}

/**
 * Update the MCP settings for both VS Code and Claude
 * @param {string} githubToken - The GitHub token to use
 * @returns {Promise<boolean>} Whether the update was successful for at least one client
 */
async function updateMcpSettings(githubToken) {
  const archyConfig = readArchyConfig();
  
  // Update the args path to use the absolute path to the build directory
  const buildPath = path.join(currentDir, 'build', 'index.js');
  archyConfig.mcpServers.archy.args = [buildPath];
  
  // Add the GitHub token to the environment variables if provided
  if (githubToken) {
    archyConfig.mcpServers.archy.env = {
      ...archyConfig.mcpServers.archy.env,
      GITHUB_TOKEN: githubToken
    };
  }
  
  // Make the build/index.js file executable
  if (process.platform !== 'win32') {
    try {
      execSync(`chmod +x "${buildPath}"`);
      console.log('Made the server executable');
    } catch (error) {
      console.warn('Warning: Could not make the server executable:', error.message);
    }
  }
  
  // Update VS Code MCP settings
  const vsCodePath = getVSCodeMcpSettingsPath();
  const vsCodeSuccess = updateMcpSettingsFile(vsCodePath, archyConfig, 'VS Code');
  
  // Update Claude MCP settings
  const claudePath = getClaudeMcpSettingsPath();
  const claudeSuccess = updateMcpSettingsFile(claudePath, archyConfig, 'Claude');
  
  // Return true if at least one update was successful
  return vsCodeSuccess || claudeSuccess;
}

/**
 * Main function
 */
async function main() {
  console.log('Installing Archy MCP server...');
  
  try {
    // Prompt for GitHub token
    const githubToken = await promptForGitHubToken();
    
    if (await updateMcpSettings(githubToken)) {
      console.log('\nInstallation successful!');
      console.log('\nYou can now use the Archy MCP server with your MCP clients (VS Code and/or Claude).');
      
      if (githubToken) {
        console.log('GitHub token has been configured for repository analysis.');
      } else {
        console.log('No GitHub token was provided. GitHub repository analysis will be limited to public repositories.');
      }
    } else {
      console.error('\nInstallation failed. Please check the error messages above.');
    }
  } catch (error) {
    console.error('Error during installation:', error.message);
  } finally {
    // Close the readline interface
    rl.close();
  }
}

// Run the main function
main();