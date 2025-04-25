/**
 * LangChain Configuration with OpenRouter
 * 
 * This file contains configuration for LangChain integration using OpenRouter
 * as the provider. OpenRouter allows access to various AI models through a
 * unified API that's compatible with the OpenAI API format.
 */

import { ChatOpenAI } from "langchain/chat_models/openai";

/**
 * Environment variables for API configuration
 * These should be set in the environment or in the MCP configuration
 */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Model configuration options
 * These define the different models that can be used for different tasks
 */
export const MODEL_CONFIGS = {
  // Default model for general diagram generation
  DEFAULT: {
    modelName: "openai/gpt-3.5-turbo",
    temperature: 0.2,
    maxTokens: 1500,
  },
  // More capable model for complex diagrams
  ADVANCED: {
    modelName: "anthropic/claude-3-sonnet",
    temperature: 0.1,
    maxTokens: 2500,
  },
  // Model for code analysis
  CODE_ANALYSIS: {
    modelName: "openai/gpt-4",
    temperature: 0.1,
    maxTokens: 3000,
  }
};

/**
 * Create a ChatOpenAI instance configured to use OpenRouter
 * 
 * @param {string} modelType - The type of model to use (DEFAULT, ADVANCED, CODE_ANALYSIS)
 * @returns {ChatOpenAI} A configured ChatOpenAI instance
 */
export function createChatModel(modelType: keyof typeof MODEL_CONFIGS = "DEFAULT"): ChatOpenAI {
  const config = MODEL_CONFIGS[modelType];
  
  return new ChatOpenAI({
    modelName: config.modelName,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    openAIApiKey: OPENROUTER_API_KEY,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/yourusername/archy", // Replace with your actual repo
        "X-Title": "Archy Diagram Generator"
      }
    }
  });
}

/**
 * Check if the OpenRouter API key is configured
 * 
 * @returns {boolean} True if the API key is configured, false otherwise
 */
export function isApiConfigured(): boolean {
  return !!OPENROUTER_API_KEY;
}