/**
 * In-Memory Git Utility
 * 
 * This file contains utility functions for working with git repositories in memory
 * using isomorphic-git and memfs. This allows for git operations without writing
 * to the file system.
 */

import * as git from 'isomorphic-git';
import { fs as memfs } from 'memfs';
import { Dirent } from 'fs';
import http from 'isomorphic-git/http/web/index.cjs';

/**
 * Repository commit information
 */
export interface CommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
  files: {
    path: string;
    type: 'add' | 'modify' | 'delete';
  }[];
}

/**
 * In-memory git repository
 */
export class InMemoryGit {
  private fs = memfs.promises;
  private dir: string;
  
  /**
   * Create a new in-memory git repository
   * @param {string} dir - The directory path in the virtual file system
   */
  constructor(dir: string = '/repo') {
    this.dir = dir;
  }
  
  /**
   * Initialize a new git repository
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    // Create the directory if it doesn't exist
    await this.fs.mkdir(this.dir, { recursive: true });
    
    // Initialize the repository
    await git.init({ fs: memfs, dir: this.dir });
  }
  
  /**
   * Clone a repository from a URL
   * @param {string} url - The URL of the repository to clone
   * @param {string} token - GitHub token for authentication (optional)
   * @returns {Promise<void>}
   */
  async clone(url: string, token?: string): Promise<void> {
    const headers = token ? { Authorization: `token ${token}` } : undefined;
    
    await git.clone({
      fs: memfs,
      http,
      dir: this.dir,
      url,
      singleBranch: true,
      depth: 10, // Limit to 10 commits as requested
      headers
    });
  }
  
  /**
   * Get the list of commits in the repository
   * @param {number} limit - Maximum number of commits to return
   * @returns {Promise<CommitInfo[]>} The list of commits
   */
  async getCommits(limit: number = 10): Promise<CommitInfo[]> {
    // Get the current branch
    const currentBranch = await git.currentBranch({
      fs: memfs,
      dir: this.dir
    });
    
    if (!currentBranch) {
      throw new Error('No current branch found');
    }
    
    // Get the commit log
    const commits = await git.log({
      fs: memfs,
      dir: this.dir,
      depth: limit
    });
    
    // Transform the commits to our format
    return Promise.all(commits.map(async commit => {
      // If this is not the first commit, get the diff with the previous commit
      const files: Array<{ path: string; type: 'add' | 'modify' | 'delete' }> = [];
      
      // Check if the commit has parents
      const parents = commit.commit.parent || [];
      
      if (parents.length > 0) {
        const diff = await git.walk({
          fs: memfs,
          dir: this.dir,
          trees: [
            git.TREE({ ref: parents[0] }),
            git.TREE({ ref: commit.oid })
          ],
          map: async (filepath: string, [a, b]: any[]) => {
            if (!a && b) {
              files.push({ path: filepath, type: 'add' });
            } else if (a && !b) {
              files.push({ path: filepath, type: 'delete' });
            } else if (a && b && a.oid !== b.oid) {
              files.push({ path: filepath, type: 'modify' });
            }
            return null;
          }
        });
      }
      
      return {
        sha: commit.oid,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          timestamp: commit.commit.author.timestamp
        },
        files
      };
    }));
  }
  
  /**
   * Get the content of a file at a specific commit
   * @param {string} filepath - The path of the file
   * @param {string} commitSha - The commit SHA (optional, defaults to HEAD)
   * @returns {Promise<string>} The file content
   */
  async getFileAtCommit(filepath: string, commitSha?: string): Promise<string> {
    const ref = commitSha || 'HEAD';
    
    try {
      const { blob } = await git.readBlob({
        fs: memfs,
        dir: this.dir,
        oid: ref,
        filepath
      });
      
      return new TextDecoder().decode(blob);
    } catch (error) {
      throw new Error(`File not found at commit ${ref}: ${filepath}`);
    }
  }
  
  /**
   * Get the list of files in the repository at a specific commit
   * @param {string} commitSha - The commit SHA (optional, defaults to HEAD)
   * @returns {Promise<string[]>} The list of file paths
   */
  async getFilesAtCommit(commitSha?: string): Promise<string[]> {
    const ref = commitSha || 'HEAD';
    
    const files: string[] = [];
    
    await git.walk({
      fs: memfs,
      dir: this.dir,
      trees: [git.TREE({ ref })],
      map: async (filepath: string, [entry]: any[]) => {
        if (entry && typeof entry.type === 'string' && entry.type === 'blob') {
          files.push(filepath);
        }
        return null;
      }
    });
    
    return files;
  }
  
  /**
   * Get the diff between two commits
   * @param {string} oldCommitSha - The old commit SHA
   * @param {string} newCommitSha - The new commit SHA
   * @returns {Promise<{path: string, type: 'add' | 'modify' | 'delete', oldContent?: string, newContent?: string}[]>} The diff
   */
  async getDiff(oldCommitSha: string, newCommitSha: string): Promise<{
    path: string;
    type: 'add' | 'modify' | 'delete';
    oldContent?: string;
    newContent?: string;
  }[]> {
    const diff: {
      path: string;
      type: 'add' | 'modify' | 'delete';
      oldContent?: string;
      newContent?: string;
    }[] = [];
    
    await git.walk({
      fs: memfs,
      dir: this.dir,
      trees: [
        git.TREE({ ref: oldCommitSha }),
        git.TREE({ ref: newCommitSha })
      ],
      map: async (filepath: string, [a, b]: any[]) => {
        if (!a && b) {
          // File added
          const newContent = await this.getFileAtCommit(filepath, newCommitSha);
          diff.push({ path: filepath, type: 'add', newContent });
        } else if (a && !b) {
          // File deleted
          const oldContent = await this.getFileAtCommit(filepath, oldCommitSha);
          diff.push({ path: filepath, type: 'delete', oldContent });
        } else if (a && b && a.oid !== b.oid) {
          // File modified
          const oldContent = await this.getFileAtCommit(filepath, oldCommitSha);
          const newContent = await this.getFileAtCommit(filepath, newCommitSha);
          diff.push({ path: filepath, type: 'modify', oldContent, newContent });
        }
        return null;
      }
    });
    
    return diff;
  }
  
  /**
   * Get the evolution of a file across commits
   * @param {string} filepath - The path of the file
   * @param {number} limit - Maximum number of commits to analyze
   * @returns {Promise<{sha: string, message: string, content: string}[]>} The file evolution
   */
  async getFileEvolution(filepath: string, limit: number = 10): Promise<{
    sha: string;
    message: string;
    content: string;
  }[]> {
    const commits = await this.getCommits(limit);
    const evolution: { sha: string; message: string; content: string }[] = [];
    
    for (const commit of commits) {
      try {
        const content = await this.getFileAtCommit(filepath, commit.sha);
        evolution.push({
          sha: commit.sha,
          message: commit.message,
          content
        });
      } catch (error) {
        // File doesn't exist at this commit, skip
      }
    }
    
    return evolution;
  }
  
  /**
   * Get the structure of the repository at a specific commit
   * @param {string} commitSha - The commit SHA (optional, defaults to HEAD)
   * @returns {Promise<{path: string, type: 'file' | 'directory'}[]>} The repository structure
   */
  async getRepoStructure(commitSha?: string): Promise<{
    path: string;
    type: 'file' | 'directory';
  }[]> {
    const ref = commitSha || 'HEAD';
    const structure: { path: string; type: 'file' | 'directory' }[] = [];
    const directories = new Set<string>();
    
    await git.walk({
      fs: memfs,
      dir: this.dir,
      trees: [git.TREE({ ref })],
      map: async (filepath: string, [entry]: any[]) => {
        if (entry) {
          if (typeof entry.type === 'string' && entry.type === 'blob') {
            structure.push({ path: filepath, type: 'file' });
            
            // Add all parent directories
            let dirPath = filepath;
            while ((dirPath = dirPath.substring(0, dirPath.lastIndexOf('/'))) !== '') {
              directories.add(dirPath);
            }
          }
        }
        return null;
      }
    });
    
    // Add directories to the structure
    for (const dir of directories) {
      structure.push({ path: dir, type: 'directory' });
    }
    
    return structure;
  }
}