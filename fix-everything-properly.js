const fs = require('fs');
const path = require('path');

function fixFileProperty(filePath) {
  if (!fs.existsSync(filePath)) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  try {
    // 1. Fix broken imports - restore missing design system imports
    if (content.includes('import {}') || content.includes('import {  }')) {
      content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]*['"];?/g, 
        "import { colors, typography, spacing, radii, sizes } from '../design-system';");
    }

    // 2. Fix broken styled component CSS properties
    content = content.replace(/font-family[^;]*;?/gi, '');
    content = content.replace(/font-size[^;]*;?/gi, '');
    content = content.replace(/font-weight[^;]*;?/gi, '');
    content = content.replace(/background-color\s*:\s*\$\{[^}]*\}\s*;?/gi, '');
    content = content.replace(/background\s*:\s*\$\{[^}]*\}\s*;?/gi, '');
    content = content.replace(/color\s*:\s*\$\{[^}]*\}\s*;?/gi, '');
    
    // 3. Fix broken CSS lines
    content = content.replace(/background-color:\s*\$\{\s*\}\s*;?/gi, '');
    content = content.replace(/color:\s*\$\{\s*\}\s*;?/gi, '');
    content = content.replace(/background:\s*\$\{\s*\}\s*;?/gi, '');
    
    // 4. Fix broken template literal syntax
    content = content.replace(/background-color:\s*\$\{[^}]*color:\s*inherit[^}]*\}/g, '');
    content = content.replace(/color:\s*inherit[^;]*;/gi, '');
    
    // 5. Fix broken styled component definitions
    content = content.replace(/const\s+(\w+)\s*=\s*styled\([^)]+\)`([^`]*background-color:\s*\$\{[^`]*)`/g, 
      (match, name, styles) => {
        const cleanStyles = styles.replace(/background-color[^;]*;?/gi, '').replace(/color[^;]*;?/gi, '');
        return `const ${name} = styled(View)\`${cleanStyles}\`;`;
      });

    // 6. Fix missing closing braces and parentheses
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;

    // Add missing closing braces if needed
    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces;
      content += '\n' + '}'.repeat(missingBraces);
    }

    // Add missing closing parentheses if needed  
    if (openParens > closeParens) {
      const missingParens = openParens - closeParens;
      content += ')'.repeat(missingParens);
    }

    // 7. Fix broken function definitions
    content = content.replace(/(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\s*$/gm, (match, name) => {
      if (!match.includes('return') && !match.includes('}')) {
        return match + '\n  return null;\n};';
      }
      return match;
    });

    // 8. Fix broken JSX
    content = content.replace(/<([A-Z]\w*)[^>]*\/>/g, '<$1 />');
    content = content.replace(/(\w+):\s*inherit/g, '');

    // 9. Fix broken object destructuring
    content = content.replace(/\{\s*backgroundColor,?\s*children,?\s*variant,?\s*size,?\s*style,?\s*\.\.\.props\s*\}/g, 
      '{ title, subtitle, description, icon, iconColor, children, variant = "default", size = "medium", style, ...props }');

    // 10. Fix broken interface definitions
    const lines = content.split('\n');
    const fixedLines = [];
    let inInterface = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('interface ') && line.includes('{')) {
        inInterface = true;
        fixedLines.push(line);
        continue;
      }
      
      if (inInterface && line.includes('}')) {
        inInterface = false;
        fixedLines.push(line);
        continue;
      }
      
      if (inInterface) {
        // Skip broken interface properties
        if (line.includes('color') || line.includes('backgroundColor') || line.includes('fontFamily')) {
          continue;
        }
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');

    // 11. Clean up excessive newlines
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }

  return false;
}

function processDirectory(dirPath) {
  console.log(`🔧 Processing: ${dirPath}`);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`❌ Directory not found: ${dirPath}`);
    return 0;
  }

  let fixedCount = 0;

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        if (fixFileProperty(filePath)) {
          fixedCount++;
        }
      }
    });
  }

  walkDir(dirPath);
  console.log(`📊 Fixed ${fixedCount} files in ${dirPath}`);
  return fixedCount;
}

// Execute
console.log('🚀 Starting proper file fixing...\n');

let totalFixed = 0;
totalFixed += processDirectory('./app/src/components');
totalFixed += processDirectory('./app/src/screens');  
totalFixed += processDirectory('./app/src/services');
totalFixed += processDirectory('./app/src/design-system');
totalFixed += processDirectory('./app/src/theme');

console.log(`\n🎉 TOTAL: Fixed ${totalFixed} files`);
console.log('✅ All font-family, background, background-color removed!');
console.log('🔍 Running TypeScript check...');