/**
 * Example: Generate a diagram from text description
 * 
 * This example demonstrates how to use the Archy MCP server
 * to generate a diagram from a text description.
 */

// This is a simulation of how you would use the Archy MCP server
// In a real application, you would use the MCP client to call the server
console.log("Example: Generate a diagram from text description");
console.log("\nInput:");
console.log("------");

interface DiagramInput {
  description: string;
  diagramType: string;
}

const input: DiagramInput = {
  description: "Create a class diagram for a blog system with User, Post, and Comment classes. Users can write multiple posts and comments. Posts can have multiple comments.",
  diagramType: "classDiagram"
};

console.log(JSON.stringify(input, null, 2));

console.log("\nOutput:");
console.log("-------");

// This is the expected output from the Archy MCP server
const output = `Generated classDiagram diagram from text description:

\`\`\`mermaid
classDiagram
    class User {
        +String username
        +String email
        +String password
        +createPost()
        +createComment()
    }
    class Post {
        +String title
        +String content
        +Date createdAt
        +addComment()
    }
    class Comment {
        +String content
        +Date createdAt
    }
    User "1" -- "*" Post: writes
    User "1" -- "*" Comment: writes
    Post "1" -- "*" Comment: has
\`\`\``;

console.log(output);

console.log("\nTo use this example with the actual MCP server:");
console.log("1. Make sure the Archy MCP server is installed and enabled in your MCP settings");
console.log("2. Use the MCP client to call the 'generate_diagram_from_text' tool with the input above");