/**
 * Example: List supported diagram types
 * 
 * This example demonstrates how to use the Archy MCP server
 * to list all supported diagram types.
 */

// This is a simulation of how you would use the Archy MCP server
// In a real application, you would use the MCP client to call the server
console.log("Example: List supported diagram types");
console.log("\nInput:");
console.log("------");

const input: Record<string, never> = {};

console.log(JSON.stringify(input, null, 2));

console.log("\nOutput:");
console.log("-------");

// This is the expected output from the Archy MCP server
const output = `
# Supported Diagram Types

1. **flowchart** - Flowcharts for visualizing processes and workflows
2. **sequenceDiagram** - Sequence diagrams for showing interactions between components
3. **classDiagram** - Class diagrams for showing object-oriented structures
4. **stateDiagram** - State diagrams for showing state transitions
5. **entityRelationshipDiagram** - ER diagrams for database schema visualization
6. **userJourney** - User journey diagrams for mapping user experiences
7. **gantt** - Gantt charts for project planning and scheduling
8. **pieChart** - Pie charts for showing proportions
9. **quadrantChart** - Quadrant charts for categorizing items
10. **requirementDiagram** - Requirement diagrams for software requirements
11. **gitGraph** - Git graphs for visualizing Git workflows
12. **c4Diagram** - C4 diagrams for software architecture visualization
`;

console.log(output);

console.log("\nTo use this example with the actual MCP server:");
console.log("1. Make sure the Archy MCP server is installed and enabled in your MCP settings");
console.log("2. Use the MCP client to call the 'list_supported_diagram_types' tool");