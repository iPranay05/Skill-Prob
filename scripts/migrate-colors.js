#!/usr/bin/env node

/**
 * Color Migration Script
 * Replaces hardcoded color values with semantic Tailwind classes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mapping from hardcoded values to semantic names
const colorMappings = {
  // Primary Purple
  '#5e17eb': 'primary',
  '#7c3aed': 'primary-light',
  '#4c0db0': 'primary-dark',
  '#4a12c4': 'primary-dark',
  'purple-600': 'primary',
  'purple-700': 'primary-dark',
  'purple-500': 'primary-light',
  
  // Secondary Green
  '#10b981': 'secondary',
  '#34d399': 'secondary-light',
  '#059669': 'secondary-dark',
  'green-600': 'secondary',
  'green-500': 'secondary-light',
  
  // Accent Orange
  '#f59e0b': 'accent',
  '#fbbf24': 'accent-light',
  '#d97706': 'accent-dark',
  'orange-600': 'accent',
  'orange-500': 'accent-light',
  
  // Error Red
  '#ef4444': 'error',
  'red-600': 'error',
  'red-500': 'error',
  
  // Success
  'green-600': 'success',
  
  // Info Blue
  '#3b82f6': 'info',
  'blue-600': 'info',
  'blue-500': 'info',
};

// Patterns to match and replace
const patterns = [
  // bg-[#hex]
  {
    regex: /bg-\[#([0-9a-fA-F]{6})\]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `bg-${color}` : match;
    }
  },
  // text-[#hex]
  {
    regex: /text-\[#([0-9a-fA-F]{6})\]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `text-${color}` : match;
    }
  },
  // border-[#hex]
  {
    regex: /border-\[#([0-9a-fA-F]{6})\]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `border-${color}` : match;
    }
  },
  // ring-[#hex]
  {
    regex: /ring-\[#([0-9a-fA-F]{6})\]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `ring-${color}` : match;
    }
  },
  // Tailwind color classes
  {
    regex: /\b(bg|text|border|ring)-(purple|green|orange|red|blue)-(500|600|700)\b/g,
    replace: (match, prefix, colorName, shade) => {
      const key = `${colorName}-${shade}`;
      const color = colorMappings[key];
      return color ? `${prefix}-${color}` : match;
    }
  },
  // Style prop with backgroundColor
  {
    regex: /backgroundColor:\s*['"]#([0-9a-fA-F]{6})['"]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `className="bg-${color}"` : match;
    }
  },
  // Style prop with borderTopColor
  {
    regex: /borderTopColor:\s*['"]#([0-9a-fA-F]{6})['"]/g,
    replace: (match, hex) => {
      const color = colorMappings[`#${hex.toLowerCase()}`];
      return color ? `className="border-t-${color}"` : match;
    }
  }
];

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  patterns.forEach(({ regex, replace }) => {
    const newContent = content.replace(regex, replace);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  }
  
  return false;
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  const files = glob.sync('**/*.{tsx,ts,jsx,js}', {
    cwd: srcDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.next/**']
  });
  
  console.log(`🔍 Found ${files.length} files to check\n`);
  
  let migratedCount = 0;
  files.forEach(file => {
    if (migrateFile(file)) {
      migratedCount++;
    }
  });
  
  console.log(`\n✨ Migration complete!`);
  console.log(`📝 ${migratedCount} files updated`);
  console.log(`📋 ${files.length - migratedCount} files unchanged`);
}

main();
