/**
 * Text-to-Diagram Generator
 * 
 * This file contains functions for generating Mermaid diagrams from text descriptions.
 */

import { extractEntities, extractRelationships, extractProcessSteps } from '../utils/entity-extractor.js';

/**
 * Generate a diagram from a text description.
 * 
 * This function analyzes the text description and generates a Mermaid diagram
 * based on the content and the specified diagram type.
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the diagram
 */
export function generateDiagramFromText(diagramType: string, description: string): string {
  // Extract entities and relationships from the description
  const entities = extractEntities(description);
  const relationships = extractRelationships(description, entities);
  
  // Generate the appropriate diagram based on the diagram type
  switch (diagramType) {
    case 'classDiagram':
      return generateClassDiagram(entities, relationships);
    
    case 'flowchart':
      return generateFlowchart(description);
    
    case 'sequenceDiagram':
      return generateSequenceDiagram(entities, relationships);
    
    case 'entityRelationshipDiagram':
      return generateERDiagram(entities, relationships);
    
    case 'stateDiagram':
      return generateStateDiagram(description);
    
    case 'userJourney':
      return generateUserJourney(description);
    
    case 'gantt':
      return generateGantt(description);
    
    case 'pieChart':
      return generatePieChart(description);
    
    case 'quadrantChart':
      return generateQuadrantChart(description);
    
    case 'requirementDiagram':
      return generateRequirementDiagram(description);
    
    case 'gitGraph':
      return generateGitGraph(description);
    
    case 'c4Diagram':
      return generateC4Diagram(description);
    
    default:
      // Default diagram for unsupported diagram types
      return `flowchart TD
    A[Start] --> B[End]
    note "Could not generate specific diagram type: ${diagramType}" as N
    A --- N`;
  }
}

/**
 * Generate a class diagram from entities and relationships.
 * 
 * @param {string[]} entities - The identified entities
 * @param {Array<{from: string, to: string, label: string}>} relationships - The identified relationships
 * @returns {string} The Mermaid syntax code for the class diagram
 */
export function generateClassDiagram(entities: string[], relationships: Array<{from: string, to: string, label: string}>): string {
  let diagram = 'classDiagram\n';
  
  // Add classes
  for (const entity of entities) {
    diagram += `    class ${entity} {\n`;
    
    // Add some placeholder attributes and methods based on entity name
    diagram += `        +String name\n`;
    diagram += `        +String description\n`;
    
    // Add methods based on common patterns
    if (entity.toLowerCase().includes('service')) {
      diagram += `        +getData()\n`;
      diagram += `        +processRequest()\n`;
    } else if (entity.toLowerCase().includes('controller')) {
      diagram += `        +handleRequest()\n`;
      diagram += `        +sendResponse()\n`;
    } else if (entity.toLowerCase().includes('repository')) {
      diagram += `        +findById()\n`;
      diagram += `        +save()\n`;
    } else {
      diagram += `        +getInfo()\n`;
      diagram += `        +update()\n`;
    }
    
    diagram += `    }\n`;
  }
  
  // Add relationships
  for (const rel of relationships) {
    let relationshipType = '<-->';
    
    // Determine relationship type based on label
    if (rel.label.includes('has') || rel.label.includes('contains')) {
      relationshipType = ' *-- ';
    } else if (rel.label.includes('inherits') || rel.label.includes('extends')) {
      relationshipType = ' <|-- ';
    } else if (rel.label.includes('implements')) {
      relationshipType = ' <|.. ';
    } else if (rel.label.includes('uses') || rel.label.includes('depends')) {
      relationshipType = ' --> ';
    }
    
    diagram += `    ${rel.from}${relationshipType}${rel.to} : ${rel.label}\n`;
  }
  
  return diagram;
}

/**
 * Generate a flowchart from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the flowchart
 */
export function generateFlowchart(description: string): string {
  let diagram = 'flowchart TD\n';
  
  // Extract potential process steps
  const steps = extractProcessSteps(description);
  
  // If we have steps, create a flowchart with them
  if (steps.length > 0) {
    // Create nodes for each step
    for (let i = 0; i < steps.length; i++) {
      const nodeId = String.fromCharCode(65 + i); // A, B, C, ...
      diagram += `    ${nodeId}[${steps[i]}]\n`;
    }
    
    // Connect the nodes
    for (let i = 0; i < steps.length - 1; i++) {
      const currentNodeId = String.fromCharCode(65 + i);
      const nextNodeId = String.fromCharCode(65 + i + 1);
      
      // Check if this might be a decision point
      if (steps[i].toLowerCase().includes('if') || 
          steps[i].toLowerCase().includes('decide') || 
          steps[i].toLowerCase().includes('check')) {
        // This is a decision node
        diagram += `    ${currentNodeId} -->|Yes| ${nextNodeId}\n`;
        
        // Add a branch for "No"
        if (i + 2 < steps.length) {
          const alternateNodeId = String.fromCharCode(65 + i + 2);
          diagram += `    ${currentNodeId} -->|No| ${alternateNodeId}\n`;
        }
      } else {
        // Regular connection
        diagram += `    ${currentNodeId} --> ${nextNodeId}\n`;
      }
    }
  } else {
    // Default flowchart if no steps were identified
    diagram += `    A[Start] --> B{Process Data?}\n`;
    diagram += `    B -->|Yes| C[Process Data]\n`;
    diagram += `    B -->|No| D[Skip Processing]\n`;
    diagram += `    C --> E[End]\n`;
    diagram += `    D --> E\n`;
  }
  
  return diagram;
}

/**
 * Generate a sequence diagram from entities and relationships.
 * 
 * @param {string[]} entities - The identified entities
 * @param {Array<{from: string, to: string, label: string}>} relationships - The identified relationships
 * @returns {string} The Mermaid syntax code for the sequence diagram
 */
export function generateSequenceDiagram(entities: string[], relationships: Array<{from: string, to: string, label: string}>): string {
  let diagram = 'sequenceDiagram\n';
  
  // Add participants
  for (const entity of entities) {
    diagram += `    participant ${entity}\n`;
  }
  
  // Add interactions based on relationships
  for (const rel of relationships) {
    // Determine arrow type based on relationship label
    let arrowType = '->>';
    
    // For responses or returns, use a dashed arrow
    if (rel.label.includes('return') || 
        rel.label.includes('respond') || 
        rel.label.includes('response')) {
      arrowType = '-->>';
    }
    
    diagram += `    ${rel.from}${arrowType}${rel.to}: ${rel.label}\n`;
  }
  
  // If no relationships were found, create a default sequence
  if (relationships.length === 0 && entities.length > 1) {
    for (let i = 0; i < entities.length - 1; i++) {
      diagram += `    ${entities[i]}->>+${entities[i+1]}: Request\n`;
      diagram += `    ${entities[i+1]}-->>-${entities[i]}: Response\n`;
    }
  }
  
  return diagram;
}

/**
 * Generate an Entity Relationship diagram from entities and relationships.
 * 
 * @param {string[]} entities - The identified entities
 * @param {Array<{from: string, to: string, label: string}>} relationships - The identified relationships
 * @returns {string} The Mermaid syntax code for the ER diagram
 */
export function generateERDiagram(entities: string[], relationships: Array<{from: string, to: string, label: string}>): string {
  let diagram = 'erDiagram\n';
  
  // Add relationships with cardinality
  for (const rel of relationships) {
    // Determine cardinality based on relationship label
    let cardinality = '||--o{';
    
    if (rel.label.includes('one-to-one') || rel.label.includes('1:1')) {
      cardinality = '||--||';
    } else if (rel.label.includes('many-to-many') || rel.label.includes('m:n') || rel.label.includes('n:m')) {
      cardinality = '}o--o{';
    } else if (rel.label.includes('one-to-many') || rel.label.includes('1:n') || 
              rel.label.includes('has many') || rel.label.includes('have many')) {
      cardinality = '||--o{';
    } else if (rel.label.includes('many-to-one') || rel.label.includes('n:1')) {
      cardinality = '}o--||';
    }
    
    diagram += `    ${rel.from.toUpperCase()} ${cardinality} ${rel.to.toUpperCase()} : "${rel.label}"\n`;
  }
  
  // If no relationships were found, create some default relationships
  if (relationships.length === 0 && entities.length > 1) {
    for (let i = 0; i < entities.length - 1; i++) {
      diagram += `    ${entities[i].toUpperCase()} ||--o{ ${entities[i+1].toUpperCase()} : "has"\n`;
    }
  }
  
  return diagram;
}

/**
 * Generate a state diagram from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the state diagram
 */
export function generateStateDiagram(description: string): string {
  // For now, return a placeholder state diagram
  // In a real implementation, this would analyze the text to identify states and transitions
  return `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`;
}

/**
 * Generate a user journey diagram from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the user journey diagram
 */
export function generateUserJourney(description: string): string {
  // For now, return a placeholder user journey diagram
  // In a real implementation, this would analyze the text to identify user steps and experiences
  return `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`;
}

/**
 * Generate a Gantt chart from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the Gantt chart
 */
export function generateGantt(description: string): string {
  // For now, return a placeholder Gantt chart
  // In a real implementation, this would analyze the text to identify tasks and timelines
  return `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2023-01-01, 30d
    Another task     :after a1, 20d
    section Another
    Task in sec      :2023-01-12, 12d
    another task     :24d`;
}

/**
 * Generate a pie chart from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the pie chart
 */
export function generatePieChart(description: string): string {
  // For now, return a placeholder pie chart
  // In a real implementation, this would analyze the text to identify categories and values
  return `pie title Distribution
    "A" : 42.96
    "B" : 50.05
    "C" : 6.99`;
}

/**
 * Generate a quadrant chart from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the quadrant chart
 */
export function generateQuadrantChart(description: string): string {
  // For now, return a placeholder quadrant chart
  // In a real implementation, this would analyze the text to identify items and their positions
  return `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`;
}

/**
 * Generate a requirement diagram from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the requirement diagram
 */
export function generateRequirementDiagram(description: string): string {
  // For now, return a placeholder requirement diagram
  // In a real implementation, this would analyze the text to identify requirements and relationships
  return `requirementDiagram
    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }
    element test_entity {
    type: simulation
    }
    test_entity - satisfies -> test_req`;
}

/**
 * Generate a Git graph from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the Git graph
 */
export function generateGitGraph(description: string): string {
  // For now, return a placeholder Git graph
  // In a real implementation, this would analyze the text to identify branches and commits
  return `gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`;
}

/**
 * Generate a C4 diagram from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string} The Mermaid syntax code for the C4 diagram
 */
export function generateC4Diagram(description: string): string {
  // For now, return a placeholder C4 diagram
  // In a real implementation, this would analyze the text to identify systems and relationships
  return `C4Context
    title System Context diagram for Internet Banking System
    Enterprise_Boundary(b0, "BankBoundary") {
      Person(customer, "Banking Customer", "A customer of the bank")
      System(banking_system, "Internet Banking System", "Allows customers to view information about their bank accounts")
      System_Ext(mail_system, "E-mail system", "The internal Microsoft Exchange e-mail system")
      System_Ext(mainframe, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
    }
    Rel(customer, banking_system, "Uses")
    Rel_Back(customer, mail_system, "Sends e-mails to")
    Rel_Neighbor(banking_system, mail_system, "Sends e-mails", "SMTP")
    Rel(banking_system, mainframe, "Uses")`;
}