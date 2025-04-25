/**
 * Entity Extractor Utilities
 * 
 * This file contains utility functions for extracting entities and relationships
 * from text descriptions, which are used for generating diagrams.
 */

/**
 * Extract entities from a text description.
 * 
 * This method analyzes the text description to identify potential entities
 * that can be used in diagrams.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string[]} An array of identified entities
 */
export function extractEntities(description: string): string[] {
  // Simple entity extraction based on capitalized words
  // In a real implementation, this would use NLP techniques
  const words = description.split(/\s+/);
  const entities = new Set<string>();
  
  // Look for capitalized words that might be entities
  for (const word of words) {
    // Check if the word starts with a capital letter and is not at the beginning of a sentence
    if (/^[A-Z][a-z]+/.test(word) && !word.includes('.')) {
      // Remove any punctuation
      const cleanWord = word.replace(/[.,;:!?]$/, '');
      if (cleanWord.length > 1) {
        entities.add(cleanWord);
      }
    }
  }
  
  // Look for common entity keywords
  const entityKeywords = ['class', 'entity', 'component', 'system', 'user', 'database', 'service'];
  const regex = new RegExp(`\\b(${entityKeywords.join('|')})\\s+([A-Za-z0-9_]+)\\b`, 'gi');
  let match;
  
  while ((match = regex.exec(description)) !== null) {
    entities.add(match[2]);
  }
  
  return Array.from(entities);
}

/**
 * Extract relationships between entities from a text description.
 * 
 * This method analyzes the text description to identify potential relationships
 * between the identified entities.
 * 
 * @param {string} description - The text description to analyze
 * @param {string[]} entities - The identified entities
 * @returns {Array<{from: string, to: string, label: string}>} An array of relationships
 */
export function extractRelationships(description: string, entities: string[]): Array<{from: string, to: string, label: string}> {
  const relationships: Array<{from: string, to: string, label: string}> = [];
  
  // Look for relationship patterns in the description
  // This is a simplified approach; a real implementation would use more sophisticated NLP
  
  // Create a regex pattern to match sentences containing two entities
  for (let i = 0; i < entities.length; i++) {
    for (let j = 0; j < entities.length; j++) {
      if (i !== j) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        // Look for sentences containing both entities
        const sentenceRegex = new RegExp(
          `[^.!?]*\\b${entity1}\\b[^.!?]*\\b${entity2}\\b[^.!?]*[.!?]`,
          'gi'
        );
        
        const matches = description.match(sentenceRegex);
        
        if (matches) {
          for (const match of matches) {
            // Extract relationship label based on verbs or prepositions between entities
            const betweenEntities = match.substring(
              match.indexOf(entity1) + entity1.length,
              match.indexOf(entity2)
            );
            
            // Look for verbs or relationship words
            const relationshipWords = betweenEntities.match(/\b(has|have|contains|includes|uses|calls|depends on|relates to|connects to|links to|references|inherits from|extends|implements)\b/i);
            
            const label = relationshipWords ? relationshipWords[0] : 'relates to';
            
            relationships.push({
              from: entity1,
              to: entity2,
              label
            });
          }
        }
      }
    }
  }
  
  // If no relationships were found but we have entities, create some default relationships
  if (relationships.length === 0 && entities.length > 1) {
    // Check for specific relationship keywords in the description
    const hasRelation = description.includes('has') || description.includes('have');
    const usesRelation = description.includes('uses') || description.includes('use');
    const containsRelation = description.includes('contains') || description.includes('contain');
    
    const relationLabel = hasRelation ? 'has' : (usesRelation ? 'uses' : (containsRelation ? 'contains' : 'relates to'));
    
    // Create relationships between consecutive entities
    for (let i = 0; i < entities.length - 1; i++) {
      relationships.push({
        from: entities[i],
        to: entities[i + 1],
        label: relationLabel
      });
    }
  }
  
  return relationships;
}

/**
 * Extract process steps from a text description.
 * 
 * @param {string} description - The text description to analyze
 * @returns {string[]} An array of process steps
 */
export function extractProcessSteps(description: string): string[] {
  const steps: string[] = [];
  
  // Look for numbered lists
  const numberedListRegex = /\b(\d+)[.)][\s]+([^\n.]+)/g;
  let match;
  
  while ((match = numberedListRegex.exec(description)) !== null) {
    steps.push(match[2].trim());
  }
  
  // If no numbered list was found, look for steps indicated by keywords
  if (steps.length === 0) {
    const stepKeywords = ['first', 'then', 'next', 'finally', 'lastly'];
    const sentences = description.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      for (const keyword of stepKeywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          steps.push(sentence.trim());
          break;
        }
      }
    }
  }
  
  // If still no steps, extract sentences that might be actions
  if (steps.length === 0) {
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences) {
      // Look for sentences that start with a verb (action)
      if (/^\s*[A-Z][a-z]+\s+[a-z]+/.test(sentence)) {
        const trimmed = sentence.trim();
        if (trimmed.length > 10 && trimmed.length < 60) { // Reasonable length for a step
          steps.push(trimmed);
        }
      }
    }
  }
  
  return steps;
}