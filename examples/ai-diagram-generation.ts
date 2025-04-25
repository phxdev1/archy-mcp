/**
 * AI-Powered Diagram Generation Example
 * 
 * This example demonstrates how to use the AI-powered diagram generation features
 * of Archy with LangChain and OpenRouter integration.
 * 
 * To run this example:
 * 1. Set the OPENROUTER_API_KEY environment variable
 * 2. Run: ts-node --esm examples/ai-diagram-generation.ts
 */

import { 
  generateDiagramFromTextWithAI,
  generateDiagramFromCode,
  generateDiffDiagram,
  isApiConfigured
} from '../src/index.js';

// Check if the OpenRouter API is configured
if (!isApiConfigured()) {
  console.error('OpenRouter API key not configured. Please set the OPENROUTER_API_KEY environment variable.');
  process.exit(1);
}

// Example 1: Generate a diagram from a text description using AI
async function generateDiagramFromTextExample(): Promise<void> {
  console.log('Example 1: Generate a diagram from a text description using AI');
  
  const description = `
    A user authentication system with the following components:
    1. User Interface - Handles user interactions and form submissions
    2. Authentication Service - Validates credentials and issues tokens
    3. User Database - Stores user information and credentials
    4. Email Service - Sends verification emails and password reset links
    5. Token Service - Manages JWT tokens for authenticated sessions
  `;
  
  try {
    const mermaidCode = await generateDiagramFromTextWithAI('flowchart', description);
    console.log('\nGenerated Mermaid code:');
    console.log('```mermaid');
    console.log(mermaidCode);
    console.log('```');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// Example 2: Generate a diagram from code using AI
async function generateDiagramFromCodeExample(): Promise<void> {
  console.log('\nExample 2: Generate a diagram from code using AI');
  
  const code = `
class User {
  constructor(id, username, email) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.isVerified = false;
  }
  
  verify() {
    this.isVerified = true;
  }
}

class AuthService {
  constructor(userRepository, tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }
  
  async login(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user || !this.verifyPassword(user, password)) {
      throw new Error('Invalid credentials');
    }
    return this.tokenService.generateToken(user);
  }
  
  verifyPassword(user, password) {
    // Password verification logic
    return true;
  }
}

class UserRepository {
  constructor(database) {
    this.database = database;
  }
  
  async findByUsername(username) {
    // Database query logic
    return new User(1, username, 'user@example.com');
  }
  
  async save(user) {
    // Save user to database
  }
}

class TokenService {
  generateToken(user) {
    // Generate JWT token
    return 'jwt-token';
  }
  
  verifyToken(token) {
    // Verify JWT token
    return true;
  }
}
  `;
  
  try {
    const mermaidCode = await generateDiagramFromCode('classDiagram', code);
    console.log('\nGenerated Mermaid code:');
    console.log('```mermaid');
    console.log(mermaidCode);
    console.log('```');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// Example 3: Generate a diff diagram showing changes between two versions of code
async function generateDiffDiagramExample(): Promise<void> {
  console.log('\nExample 3: Generate a diff diagram showing changes between two versions of code');
  
  const beforeCode = `
class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  
  async login(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user || !this.verifyPassword(user, password)) {
      throw new Error('Invalid credentials');
    }
    return { success: true };
  }
  
  verifyPassword(user, password) {
    // Password verification logic
    return true;
  }
}
  `;
  
  const afterCode = `
class AuthService {
  constructor(userRepository, tokenService, emailService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
  }
  
  async login(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (!user || !this.verifyPassword(user, password)) {
      throw new Error('Invalid credentials');
    }
    
    // Generate authentication token
    const token = this.tokenService.generateToken(user);
    
    // Log login activity
    await this.logActivity(user, 'login');
    
    return { success: true, token };
  }
  
  verifyPassword(user, password) {
    // Password verification logic
    return true;
  }
  
  async logActivity(user, activity) {
    // Log user activity
  }
  
  async sendPasswordResetEmail(email) {
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      const resetToken = this.tokenService.generateResetToken(user);
      await this.emailService.sendPasswordReset(user.email, resetToken);
    }
  }
}
  `;
  
  try {
    const mermaidCode = await generateDiffDiagram('classDiagram', beforeCode, afterCode);
    console.log('\nGenerated Mermaid code:');
    console.log('```mermaid');
    console.log(mermaidCode);
    console.log('```');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

// Run the examples
(async (): Promise<void> => {
  await generateDiagramFromTextExample();
  await generateDiagramFromCodeExample();
  await generateDiffDiagramExample();
})();