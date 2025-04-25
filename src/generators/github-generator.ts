/**
 * GitHub-to-Diagram Generator
 * 
 * This file contains functions for generating Mermaid diagrams from GitHub repository data.
 */

/**
 * Generate a diagram from GitHub repository data.
 * 
 * This function analyzes the repository data and generates a Mermaid diagram
 * based on the repository structure and the specified diagram type.
 * 
 * @param {string} diagramType - The type of diagram to generate
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the diagram
 */
export function generateDiagramFromGithub(diagramType: string, owner: string, repo: string, repoData: any): string {
  switch (diagramType) {
    case 'flowchart':
      return generateRepoFlowchart(owner, repo, repoData);
    
    case 'classDiagram':
      return generateRepoClassDiagram(owner, repo, repoData);
    
    case 'c4Diagram':
      return generateRepoC4Diagram(owner, repo, repoData);
    
    case 'pieChart':
      return generateRepoLanguagePieChart(owner, repo, repoData);
    
    case 'sequenceDiagram':
      return generateRepoSequenceDiagram(owner, repo, repoData);
    
    default:
      // Default to a repository structure flowchart for unsupported diagram types
      return generateRepoFlowchart(owner, repo, repoData);
  }
}

/**
 * Generate a flowchart from GitHub repository data.
 * 
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the flowchart
 */
export function generateRepoFlowchart(owner: string, repo: string, repoData: any): string {
  let diagram = 'flowchart TD\n';
  
  // Add repository as the main node
  diagram += `    Repo[${owner}/${repo}]\n`;
  
  // Add top-level directories and files
  if (repoData.contents && Array.isArray(repoData.contents)) {
    // Group by type (directory or file)
    const directories: string[] = [];
    const files: string[] = [];
    
    for (const item of repoData.contents) {
      if (item.type === 'dir') {
        directories.push(item.name);
      } else if (item.type === 'file') {
        files.push(item.name);
      }
    }
    
    // Add directories
    for (let i = 0; i < directories.length; i++) {
      const dirId = `Dir${i}`;
      diagram += `    ${dirId}[${directories[i]}/]\n`;
      diagram += `    Repo --> ${dirId}\n`;
    }
    
    // Add files (limit to 10 to avoid cluttering)
    const maxFiles = Math.min(files.length, 10);
    for (let i = 0; i < maxFiles; i++) {
      const fileId = `File${i}`;
      diagram += `    ${fileId}[${files[i]}]\n`;
      diagram += `    Repo --> ${fileId}\n`;
    }
    
    // If there are more files, add a note
    if (files.length > maxFiles) {
      diagram += `    More[... ${files.length - maxFiles} more files]\n`;
      diagram += `    Repo --> More\n`;
    }
  }
  
  // Add code dependencies if we have code files
  if (repoData.codeFiles && repoData.codeFiles.length > 0) {
    // Analyze imports and dependencies between files
    const dependencies = analyzeCodeDependencies(repoData.codeFiles);
    
    // Add dependencies to the diagram
    for (const dep of dependencies) {
      // Create simplified file names for the diagram
      const fromFile = dep.from.split('/').pop() || dep.from;
      const toFile = dep.to.split('/').pop() || dep.to;
      
      // Add the dependency to the diagram
      diagram += `    ${fromFile} --> ${toFile}: imports\n`;
    }
  }
  
  return diagram;
}

/**
 * Generate a pie chart of repository languages.
 * 
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the pie chart
 */
export function generateRepoLanguagePieChart(owner: string, repo: string, repoData: any): string {
  let diagram = `pie title Language Distribution for ${owner}/${repo}\n`;
  
  // Add language data
  if (repoData.languages && Object.keys(repoData.languages).length > 0) {
    // Calculate total bytes
    const totalBytes = Object.values(repoData.languages).reduce((sum: number, bytes: unknown) => sum + (bytes as number), 0);
    
    // Add each language with its percentage
    for (const [language, bytes] of Object.entries(repoData.languages)) {
      const percentage = ((bytes as number) / (totalBytes as number) * 100).toFixed(2);
      diagram += `    "${language}" : ${percentage}\n`;
    }
  } else {
    // Default if no language data is available
    diagram += `    "Unknown" : 100\n`;
  }
  
  return diagram;
}

/**
 * Generate a class diagram from GitHub repository data.
 * 
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the class diagram
 */
export function generateRepoClassDiagram(owner: string, repo: string, repoData: any): string {
  let diagram = 'classDiagram\n';
  
  // If we have code files, analyze them to extract classes and relationships
  if (repoData.codeFiles && repoData.codeFiles.length > 0) {
    const { classes, relationships } = extractClassesFromCode(repoData.codeFiles);
    
    // Add classes to the diagram
    for (const cls of classes) {
      diagram += `    class ${cls.name} {\n`;
      
      // Add properties
      for (const prop of cls.properties) {
        const visibility = prop.visibility || '+';
        diagram += `        ${visibility}${prop.type} ${prop.name}\n`;
      }
      
      // Add methods
      for (const method of cls.methods) {
        const visibility = method.visibility || '+';
        diagram += `        ${visibility}${method.name}()\n`;
      }
      
      diagram += `    }\n`;
    }
    
    // Add relationships to the diagram
    for (const rel of relationships) {
      diagram += `    ${rel.from} ${rel.type} ${rel.to}`;
      if (rel.label) {
        diagram += ` : ${rel.label}`;
      }
      diagram += '\n';
    }
  } else {
    // Fallback to a generic repository class diagram
    diagram += `    class Repository {
        +String name
        +String owner
        +String description
        +getContents()
        +getLanguages()
    }
    class File {
        +String name
        +String path
        +String content
        +getContent()
    }
    class Directory {
        +String name
        +String path
        +getFiles()
        +getSubdirectories()
    }
    Repository *-- File : contains
    Repository *-- Directory : contains
    Directory *-- File : contains`;
  }
  
  return diagram;
}

/**
 * Generate a C4 diagram from GitHub repository data.
 * 
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the C4 diagram
 */
export function generateRepoC4Diagram(owner: string, repo: string, repoData: any): string {
  // For now, return a placeholder C4 diagram
  // In a real implementation, this would analyze the repository code to identify systems and components
  return `C4Context
    title System Context diagram for ${repo}
    Enterprise_Boundary(b0, "${owner}") {
      Person(user, "User", "A user of the system")
      System(system, "${repo}", "${repoData.info?.description || 'A software system'}")
    }
    System_Ext(external, "External System", "An external system that ${repo} interacts with")
    Rel(user, system, "Uses")
    Rel(system, external, "Calls API")`;
}

/**
 * Generate a sequence diagram from GitHub repository data.
 * 
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 * @param {any} repoData - The repository data from GitHub API
 * @returns {string} The Mermaid syntax code for the sequence diagram
 */
export function generateRepoSequenceDiagram(owner: string, repo: string, repoData: any): string {
  // If we have code files, analyze them to extract interactions
  if (repoData.codeFiles && repoData.codeFiles.length > 0) {
    const interactions = extractInteractionsFromCode(repoData.codeFiles);
    
    if (interactions.length > 0) {
      let diagram = 'sequenceDiagram\n';
      
      // Add participants
      const participants = new Set<string>();
      for (const interaction of interactions) {
        participants.add(interaction.from);
        participants.add(interaction.to);
      }
      
      for (const participant of participants) {
        diagram += `    participant ${participant}\n`;
      }
      
      // Add interactions
      for (const interaction of interactions) {
        diagram += `    ${interaction.from}->>+${interaction.to}: ${interaction.message}\n`;
        if (interaction.response) {
          diagram += `    ${interaction.to}-->>-${interaction.from}: ${interaction.response}\n`;
        }
      }
      
      return diagram;
    }
  }
  
  // Fallback to a generic sequence diagram
  return `sequenceDiagram
    participant User
    participant ${repo}
    participant Database
    User->>+${repo}: Request
    ${repo}->>+Database: Query
    Database-->>-${repo}: Results
    ${repo}-->>-User: Response`;
}

/**
 * Analyze code dependencies between files.
 *
 * This function analyzes the code files to identify dependencies
 * (imports, requires, etc.) between files.
 *
 * @param {Array<{path: string, content: string, language: string}>} codeFiles - The code files to analyze
 * @returns {Array<{from: string, to: string}>} An array of dependencies
 */
function analyzeCodeDependencies(codeFiles: Array<{path: string, content: string, language: string}>): Array<{from: string, to: string}> {
  const dependencies: Array<{from: string, to: string}> = [];
  
  // Map of file paths to simplified names (without extension)
  const fileMap = new Map<string, string>();
  for (const file of codeFiles) {
    const simpleName = file.path.split('/').pop()?.split('.')[0] || file.path;
    fileMap.set(simpleName, file.path);
  }
  
  // Analyze each file for imports/requires
  for (const file of codeFiles) {
    const fromPath = file.path;
    
    // Different import patterns based on language
    if (file.language === 'javascript' || file.language === 'typescript') {
      // Look for ES6 imports
      const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const importPath = match[1];
        
        // Handle relative imports
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Resolve the relative path (simplified)
          const importName = importPath.split('/').pop() || importPath;
          
          // Check if this import refers to one of our files
          if (fileMap.has(importName)) {
            dependencies.push({
              from: fromPath,
              to: fileMap.get(importName) || importPath
            });
          }
        }
      }
      
      // Look for CommonJS requires
      const requireRegex = /(?:const|let|var)\s+(?:{[^}]*}|\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(file.content)) !== null) {
        const requirePath = match[1];
        
        // Handle relative requires
        if (requirePath.startsWith('./') || requirePath.startsWith('../')) {
          // Resolve the relative path (simplified)
          const requireName = requirePath.split('/').pop() || requirePath;
          
          // Check if this require refers to one of our files
          if (fileMap.has(requireName)) {
            dependencies.push({
              from: fromPath,
              to: fileMap.get(requireName) || requirePath
            });
          }
        }
      }
    } else if (file.language === 'python') {
      // Look for Python imports
      const importRegex = /(?:from\s+([^\s]+)\s+import|import\s+([^\s]+))/g;
      let match;
      while ((match = importRegex.exec(file.content)) !== null) {
        const importPath = match[1] || match[2];
        
        // Check if this import refers to one of our files
        if (fileMap.has(importPath)) {
          dependencies.push({
            from: fromPath,
            to: fileMap.get(importPath) || importPath
          });
        }
      }
    }
    // Add more language-specific import patterns as needed
  }
  
  return dependencies;
}

/**
 * Extract classes and their relationships from code files.
 *
 * This function analyzes the code files to identify classes, their properties,
 * methods, and relationships between classes.
 *
 * @param {Array<{path: string, content: string, language: string}>} codeFiles - The code files to analyze
 * @returns {{classes: Array<{name: string, properties: Array<{name: string, type: string, visibility?: string}>, methods: Array<{name: string, visibility?: string}>}>, relationships: Array<{from: string, to: string, type: string, label?: string}>}} Classes and relationships
 */
function extractClassesFromCode(codeFiles: Array<{path: string, content: string, language: string}>): {
  classes: Array<{
    name: string,
    properties: Array<{name: string, type: string, visibility?: string}>,
    methods: Array<{name: string, visibility?: string}>
  }>,
  relationships: Array<{from: string, to: string, type: string, label?: string}>
} {
  const classes: Array<{
    name: string,
    properties: Array<{name: string, type: string, visibility?: string}>,
    methods: Array<{name: string, visibility?: string}>
  }> = [];
  
  const relationships: Array<{from: string, to: string, type: string, label?: string}> = [];
  
  // Analyze each file for classes
  for (const file of codeFiles) {
    if (file.language === 'javascript' || file.language === 'typescript') {
      // Look for ES6 classes
      const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^}]*)}/gs;
      let classMatch;
      
      while ((classMatch = classRegex.exec(file.content)) !== null) {
        const className = classMatch[1];
        const parentClass = classMatch[2]; // May be undefined
        const classBody = classMatch[3];
        
        // Create a new class
        const cls = {
          name: className,
          properties: [] as Array<{name: string, type: string, visibility?: string}>,
          methods: [] as Array<{name: string, visibility?: string}>
        };
        
        // Look for properties
        const propertyRegex = /(?:public|private|protected)?\s*(\w+)\s*(?::\s*(\w+))?/g;
        let propertyMatch;
        
        while ((propertyMatch = propertyRegex.exec(classBody)) !== null) {
          const propName = propertyMatch[1];
          const propType = propertyMatch[2] || 'any';
          
          // Skip if this is actually a method
          if (classBody.includes(`${propName}(`)) {
            continue;
          }
          
          // Add the property
          cls.properties.push({
            name: propName,
            type: propType
          });
        }
        
        // Look for methods
        const methodRegex = /(?:(public|private|protected))?\s*(\w+)\s*\([^)]*\)/g;
        let methodMatch;
        
        while ((methodMatch = methodRegex.exec(classBody)) !== null) {
          const visibility = methodMatch[1];
          const methodName = methodMatch[2];
          
          // Add the method
          cls.methods.push({
            name: methodName,
            visibility: visibility
          });
        }
        
        // Add the class
        classes.push(cls);
        
        // Add inheritance relationship if there's a parent class
        if (parentClass) {
          relationships.push({
            from: className,
            to: parentClass,
            type: '<|--',
            label: 'extends'
          });
        }
      }
    } else if (file.language === 'python') {
      // Look for Python classes
      const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?\s*:/g;
      let classMatch;
      
      while ((classMatch = classRegex.exec(file.content)) !== null) {
        const className = classMatch[1];
        const parentClasses = classMatch[2]; // May be undefined
        
        // Create a new class
        const cls = {
          name: className,
          properties: [] as Array<{name: string, type: string, visibility?: string}>,
          methods: [] as Array<{name: string, visibility?: string}>
        };
        
        // Look for methods (simplified)
        const methodRegex = /def\s+(\w+)\s*\([^)]*\)/g;
        let methodMatch;
        
        while ((methodMatch = methodRegex.exec(file.content)) !== null) {
          const methodName = methodMatch[1];
          
          // Skip dunder methods
          if (methodName.startsWith('__') && methodName.endsWith('__')) {
            continue;
          }
          
          // Add the method
          cls.methods.push({
            name: methodName
          });
        }
        
        // Add the class
        classes.push(cls);
        
        // Add inheritance relationships if there are parent classes
        if (parentClasses) {
          const parents = parentClasses.split(',').map(p => p.trim());
          for (const parent of parents) {
            relationships.push({
              from: className,
              to: parent,
              type: '<|--',
              label: 'inherits'
            });
          }
        }
      }
    }
    // Add more language-specific class extraction as needed
  }
  
  return { classes, relationships };
}

/**
 * Extract interactions between components from code files.
 *
 * This function analyzes the code files to identify interactions
 * between components, such as API calls, function calls, etc.
 *
 * @param {Array<{path: string, content: string, language: string}>} codeFiles - The code files to analyze
 * @returns {Array<{from: string, to: string, message: string, response?: string}>} An array of interactions
 */
function extractInteractionsFromCode(codeFiles: Array<{path: string, content: string, language: string}>): Array<{from: string, to: string, message: string, response?: string}> {
  const interactions: Array<{from: string, to: string, message: string, response?: string}> = [];
  
  // Extract components from file names
  const components = new Set<string>();
  for (const file of codeFiles) {
    // Extract component name from file path
    const pathParts = file.path.split('/');
    if (pathParts.length > 1) {
      components.add(pathParts[pathParts.length - 2]);
    }
    
    // Extract component name from file name
    const fileName = pathParts[pathParts.length - 1].split('.')[0];
    if (fileName.endsWith('Controller') ||
        fileName.endsWith('Service') ||
        fileName.endsWith('Repository') ||
        fileName.endsWith('Component')) {
      components.add(fileName);
    }
  }
  
  // Analyze each file for interactions between components
  for (const file of codeFiles) {
    const fileName = file.path.split('/').pop()?.split('.')[0] || '';
    
    // Skip if this file doesn't represent a component
    if (!components.has(fileName)) {
      continue;
    }
    
    // Look for method calls to other components
    for (const component of components) {
      if (component === fileName) {
        continue;
      }
      
      // Look for instances of the component being used
      const componentRegex = new RegExp(`${component}\\.(\\w+)`, 'g');
      let match;
      
      while ((match = componentRegex.exec(file.content)) !== null) {
        const methodName = match[1];
        
        // Add the interaction
        interactions.push({
          from: fileName,
          to: component,
          message: `${methodName}()`,
          response: 'response'
        });
      }
    }
  }
  
  // If we didn't find any interactions, create some based on component names
  if (interactions.length === 0 && components.size >= 2) {
    const componentArray = Array.from(components);
    
    // Create a simple flow between components
    for (let i = 0; i < componentArray.length - 1; i++) {
      interactions.push({
        from: componentArray[i],
        to: componentArray[i + 1],
        message: 'request',
        response: 'response'
      });
    }
  }
  
  return interactions;
}