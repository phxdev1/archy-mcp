/**
 * Mermaid Styler Utility
 * 
 * This file contains utility functions for styling Mermaid diagrams.
 */

/**
 * Adds a directive to ensure text font colors are paired with background colors
 * that are opposite on the color wheel for maximum visibility.
 * 
 * @param {string} mermaidCode - The original Mermaid diagram code
 * @returns {string} The Mermaid code with the color contrast directive added
 */
export function addColorContrastDirective(mermaidCode: string): string {
  // Create a directive that ensures text colors are paired with opposite background colors
  const colorContrastDirective = `%%{
  init: {
    "theme": "base",
    "themeVariables": {
      "primaryColor": "#1f77b4",
      "primaryTextColor": "#ffffff",
      "primaryBorderColor": "#0d3c55",
      "lineColor": "#1f77b4",
      "secondaryColor": "#ff7f0e",
      "secondaryTextColor": "#000000",
      "secondaryBorderColor": "#7f3f00",
      "tertiaryColor": "#2ca02c",
      "tertiaryTextColor": "#ffffff",
      "tertiaryBorderColor": "#0d5e0d",
      "noteBkgColor": "#fff5ad",
      "noteTextColor": "#333333",
      "noteBorderColor": "#d6b656",
      "edgeLabelBackground": "#ffffff",
      "nodeTextColor": "contrast"
    },
    "fontFamily": "trebuchet ms, verdana, arial, sans-serif",
    "logLevel": 1,
    "flowchart": {
      "useMaxWidth": true,
      "htmlLabels": true,
      "curve": "basis"
    },
    "sequence": {
      "useMaxWidth": true,
      "mirrorActors": true,
      "wrap": true,
      "rightAngles": true
    },
    "er": {
      "useMaxWidth": true
    },
    "pie": {
      "useMaxWidth": true,
      "textPosition": 0.5
    }
  }
}%%

`;

  // Check if the code already has an init directive
  if (mermaidCode.includes('%%{init:') || mermaidCode.includes('%%{init ')) {
    // If it does, don't add another one to avoid conflicts
    return mermaidCode;
  }

  // Add the directive at the beginning of the code
  return colorContrastDirective + mermaidCode;
}

/**
 * Gets the complementary color (opposite on the color wheel) for a given hex color
 * 
 * @param {string} hexColor - The hex color code (e.g., "#ff0000")
 * @returns {string} The complementary color as a hex code
 */
export function getComplementaryColor(hexColor: string): string {
  // Remove the # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  
  // Get the complementary color by inverting each component
  const rComp = 255 - r;
  const gComp = 255 - g;
  const bComp = 255 - b;
  
  // Convert back to hex
  return `#${rComp.toString(16).padStart(2, '0')}${gComp.toString(16).padStart(2, '0')}${bComp.toString(16).padStart(2, '0')}`;
}

/**
 * Adds a directive to ensure diagrams are clean and easy to read with:
 * - No overlapping lines or objects
 * - Adequate spacing
 * - Easy to read labels
 *
 * @param {string} mermaidCode - The original Mermaid diagram code
 * @returns {string} The Mermaid code with the clean layout directive added
 */
export function addCleanLayoutDirective(mermaidCode: string): string {
  // Create a directive that ensures clean, readable diagrams
  const cleanLayoutDirective = `%%{
  init: {
    "theme": "base",
    "themeVariables": {
      "fontSize": "16px",
      "fontFamily": "Arial, sans-serif"
    },
    "flowchart": {
      "diagramPadding": 20,
      "nodeSpacing": 50,
      "rankSpacing": 80,
      "curve": "linear",
      "useMaxWidth": true
    },
    "sequence": {
      "diagramMarginX": 50,
      "diagramMarginY": 30,
      "actorMargin": 120,
      "boxMargin": 25,
      "boxTextMargin": 15,
      "noteMargin": 15,
      "messageMargin": 35
    },
    "classDiagram": {
      "diagramPadding": 20,
      "useMaxWidth": true
    },
    "entityRelationshipDiagram": {
      "diagramPadding": 20,
      "useMaxWidth": true
    },
    "gantt": {
      "leftPadding": 75,
      "rightPadding": 20,
      "topPadding": 20,
      "bottomPadding": 20
    }
  }
}%%

`;

  // Check if the code already has an init directive
  if (mermaidCode.includes('%%{init:') || mermaidCode.includes('%%{init ')) {
    // If it does, don't add another one to avoid conflicts
    return mermaidCode;
  }

  // Add the directive at the beginning of the code
  return cleanLayoutDirective + mermaidCode;
}

/**
 * Applies all styling directives to ensure diagrams are optimally formatted:
 * - Color contrast for readability
 * - Clean layout with proper spacing
 * - No overlapping elements
 * - Easy to read labels
 *
 * @param {string} mermaidCode - The original Mermaid diagram code
 * @returns {string} The Mermaid code with all styling directives applied
 */
export function applyAllStylingDirectives(mermaidCode: string): string {
  // Create a comprehensive directive that combines all styling requirements
  const comprehensiveDirective = `%%{
  init: {
    "theme": "base",
    "themeVariables": {
      "primaryColor": "#1f77b4",
      "primaryTextColor": "#ffffff",
      "primaryBorderColor": "#0d3c55",
      "lineColor": "#1f77b4",
      "secondaryColor": "#ff7f0e",
      "secondaryTextColor": "#000000",
      "secondaryBorderColor": "#7f3f00",
      "tertiaryColor": "#2ca02c",
      "tertiaryTextColor": "#ffffff",
      "tertiaryBorderColor": "#0d5e0d",
      "noteBkgColor": "#fff5ad",
      "noteTextColor": "#333333",
      "noteBorderColor": "#d6b656",
      "edgeLabelBackground": "#ffffff",
      "nodeTextColor": "contrast",
      "fontSize": "16px"
    },
    "fontFamily": "Arial, sans-serif",
    "logLevel": 1,
    "flowchart": {
      "useMaxWidth": true,
      "htmlLabels": true,
      "curve": "basis",
      "diagramPadding": 20,
      "nodeSpacing": 50,
      "rankSpacing": 80
    },
    "sequence": {
      "useMaxWidth": true,
      "mirrorActors": true,
      "wrap": true,
      "rightAngles": true,
      "diagramMarginX": 50,
      "diagramMarginY": 30,
      "actorMargin": 120,
      "boxMargin": 25,
      "boxTextMargin": 15,
      "noteMargin": 15,
      "messageMargin": 35
    },
    "classDiagram": {
      "diagramPadding": 20,
      "useMaxWidth": true
    },
    "er": {
      "useMaxWidth": true,
      "diagramPadding": 20
    },
    "pie": {
      "useMaxWidth": true,
      "textPosition": 0.5
    },
    "gantt": {
      "leftPadding": 75,
      "rightPadding": 20,
      "topPadding": 20,
      "bottomPadding": 20
    }
  }
}%%

`;

  // Check if the code already has an init directive
  if (mermaidCode.includes('%%{init:') || mermaidCode.includes('%%{init ')) {
    // If it does, don't add another one to avoid conflicts
    return mermaidCode;
  }

  // Add the directive at the beginning of the code
  return comprehensiveDirective + mermaidCode;
}