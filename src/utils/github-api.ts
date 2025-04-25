/**
 * GitHub API Utilities
 * 
 * This file contains utility functions for interacting with the GitHub API
 * to fetch repository data for diagram generation.
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Create an axios instance configured for GitHub API requests.
 * 
 * @param {string|undefined} token - GitHub API token for authenticated requests
 * @returns {AxiosInstance} Configured axios instance
 */
export function createGitHubApiClient(token?: string): AxiosInstance {
  return axios.create({
    headers: token ? {
      Authorization: `token ${token}`
    } : {}
  });
}

/**
 * Fetch repository data from GitHub API.
 * 
 * This function fetches repository data including structure, files, and metadata
 * to be used for diagram generation.
 * 
 * @param {AxiosInstance} apiClient - Axios instance for making API requests
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @returns {Promise<any>} A promise that resolves to the repository data
 */
export async function fetchRepositoryData(apiClient: AxiosInstance, owner: string, repo: string): Promise<any> {
  try {
    // Fetch repository information
    const repoResponse = await apiClient.get(
      `https://api.github.com/repos/${owner}/${repo}`
    );
    
    // Fetch repository contents (top-level files and directories)
    const contentsResponse = await apiClient.get(
      `https://api.github.com/repos/${owner}/${repo}/contents`
    );
    
    // Fetch languages used in the repository
    const languagesResponse = await apiClient.get(
      `https://api.github.com/repos/${owner}/${repo}/languages`
    );
    
    // Fetch code files for analysis
    const codeFiles = await fetchCodeFiles(apiClient, owner, repo, contentsResponse.data);
    
    // Return combined repository data
    return {
      info: repoResponse.data,
      contents: contentsResponse.data,
      languages: languagesResponse.data,
      codeFiles: codeFiles
    };
  } catch (error) {
    console.error('Error fetching repository data:', error);
    throw new Error('Failed to fetch repository data from GitHub API');
  }
}

/**
 * Fetch code files from a GitHub repository for analysis.
 *
 * This function recursively fetches code files from the repository,
 * focusing on files that are likely to contain code (based on extension).
 *
 * @param {AxiosInstance} apiClient - Axios instance for making API requests
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any[]} contents - The contents of the current directory
 * @param {string} path - The current path within the repository
 * @param {number} maxFiles - Maximum number of files to fetch
 * @returns {Promise<Array<{path: string, content: string, language: string}>>} A promise that resolves to an array of code files
 */
async function fetchCodeFiles(
  apiClient: AxiosInstance,
  owner: string,
  repo: string,
  contents: any[],
  path: string = '',
  maxFiles: number = 20
): Promise<Array<{path: string, content: string, language: string}>> {
  const codeFiles: Array<{path: string, content: string, language: string}> = [];
  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.rb', '.go', '.php', '.cs', '.cpp', '.c', '.h'];
  
  // Process each item in the contents
  for (const item of contents) {
    // Stop if we've reached the maximum number of files
    if (codeFiles.length >= maxFiles) {
      break;
    }
    
    if (item.type === 'file') {
      // Check if this is a code file based on extension
      const fileExt = item.name.substring(item.name.lastIndexOf('.'));
      if (codeExtensions.includes(fileExt)) {
        try {
          // Fetch the file content
          const contentResponse = await apiClient.get(item.download_url);
          
          // Determine the language based on file extension
          let language = 'unknown';
          if (['.js', '.jsx'].includes(fileExt)) language = 'javascript';
          else if (['.ts', '.tsx'].includes(fileExt)) language = 'typescript';
          else if (fileExt === '.py') language = 'python';
          else if (fileExt === '.java') language = 'java';
          else if (fileExt === '.rb') language = 'ruby';
          else if (fileExt === '.go') language = 'go';
          else if (fileExt === '.php') language = 'php';
          else if (fileExt === '.cs') language = 'csharp';
          else if (['.cpp', '.c', '.h'].includes(fileExt)) language = 'cpp';
          
          // Add the file to our collection
          codeFiles.push({
            path: item.path,
            content: contentResponse.data,
            language: language
          });
        } catch (error) {
          console.error(`Error fetching file ${item.path}:`, error);
        }
      }
    } else if (item.type === 'dir') {
      try {
        // Fetch the contents of the subdirectory
        const subdirResponse = await apiClient.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`
        );
        
        // Recursively fetch code files from the subdirectory
        const subdirFiles = await fetchCodeFiles(
          apiClient,
          owner,
          repo,
          subdirResponse.data,
          item.path,
          maxFiles - codeFiles.length
        );
        
        // Add the subdirectory files to our collection
        codeFiles.push(...subdirFiles);
      } catch (error) {
        console.error(`Error fetching directory ${item.path}:`, error);
      }
    }
  }
  
  return codeFiles;
}

/**
 * Extract owner and repository name from a GitHub URL.
 * 
 * @param {string} url - GitHub repository URL
 * @returns {[string, string]} A tuple containing [owner, repo]
 * @throws {Error} If the URL is not a valid GitHub repository URL
 */
export function extractRepoInfoFromUrl(url: string): [string, string] {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  return [match[1], match[2]];
}