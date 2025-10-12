const fs = require('fs');
const path = require('path');

// Function to recursively find all route.ts files in dynamic directories
function findDynamicRoutes(dir) {
  const routes = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        // Check if directory name contains dynamic route pattern [param]
        if (item.name.includes('[') && item.name.includes(']')) {
          // Look for route.ts in this directory
          const routeFile = path.join(fullPath, 'route.ts');
          if (fs.existsSync(routeFile)) {
            routes.push(routeFile);
          }
        }
        // Continue traversing subdirectories
        traverse(fullPath);
      }
    }
  }
  
  traverse(dir);
  return routes;
}

// Function to fix a route file
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern to match function signatures with params
  const patterns = [
    // Match: { params }: { params: { paramName: string } }
    /(\{\s*params\s*\}:\s*\{\s*params:\s*\{[^}]+\}\s*\})/g,
    // Match: { params }: RouteParams where RouteParams has params property
    /(\{\s*params\s*\}:\s*RouteParams)/g
  ];
  
  // First, fix interface definitions
  content = content.replace(
    /interface\s+RouteParams\s*\{\s*params:\s*\{([^}]+)\}\s*;?\s*\}/g,
    'interface RouteParams {\n  params: Promise<{$1}>;\n}'
  );
  
  // Fix direct inline param types
  content = content.replace(
    /\{\s*params\s*\}:\s*\{\s*params:\s*(\{[^}]+\})\s*\}/g,
    '{ params }: { params: Promise<$1> }'
  );
  
  // Fix params destructuring - add await
  const paramDestructurePattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*params;/g;
  content = content.replace(paramDestructurePattern, 'const { $1 } = await params;');
  
  // Also handle direct usage like params.paramName
  const directParamPattern = /params\.(\w+)/g;
  const matches = content.match(directParamPattern);
  if (matches) {
    // We need to be more careful here to avoid replacing already fixed code
    // This is a simplified approach - in practice you'd want more sophisticated parsing
    console.log(`Warning: Found direct param usage in ${filePath}, may need manual review`);
  }
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    modified = true;
  }
  
  return { content, modified };
}

// Main execution
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const dynamicRoutes = findDynamicRoutes(apiDir);

console.log(`Found ${dynamicRoutes.length} dynamic route files:`);
dynamicRoutes.forEach(route => console.log(route));

let fixedCount = 0;
for (const routeFile of dynamicRoutes) {
  try {
    const { content, modified } = fixRouteFile(routeFile);
    if (modified) {
      fs.writeFileSync(routeFile, content, 'utf8');
      console.log(`Fixed: ${routeFile}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error fixing ${routeFile}:`, error.message);
  }
}

console.log(`\nFixed ${fixedCount} route files.`);